"use strict";

const previewable = new Set(["md", "markdown", "pdf", "docx", "pptx"]);
const state = { root: null, total: 0, selected: null, openFolders: new Set(), objectUrl: null };
const ui = {
  fileFilter: document.querySelector("#fileFilter"), fileCount: document.querySelector("#fileCount"), fileList: document.querySelector("#fileList"),
  title: document.querySelector("#documentTitle"), type: document.querySelector("#fileType"),
  viewer: document.querySelector("#viewer"), download: document.querySelector("#downloadButton")
};

const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
const byName = (a, b) => a.name.localeCompare(b.name, "pt-BR", { numeric: true });
const searchable = (value) => value.normalize("NFC").toLocaleLowerCase("pt-BR");

ui.fileFilter.addEventListener("input", renderTree);
window.addEventListener("load", loadFiles);
window.addEventListener("beforeunload", revokeObjectUrl);

// O navegador não lista pastas: quem informa os arquivos é o servidor, pelo
// listar.php na hospedagem ou pela página de listagem no Live Server.
async function loadFiles() {
  try { showFiles(await readPhpListing().catch(() => readServerListing())); }
  catch (error) {
    console.error(error);
    ui.fileCount.textContent = "Pasta indisponível.";
    showMessage("Não foi possível ler a pasta arquivos/. Confira se listar.php e a pasta arquivos estão publicados, ou abra esta página pelo Go Live no VS Code.", "error");
  }
}

async function readPhpListing() {
  const response = await fetch("listar.php", { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { arquivos } = await response.json();
  return arquivos.map((path) => ({ path, getFile: () => fetchFile(`arquivos/${path.split("/").map(encodeURIComponent).join("/")}`) }));
}

async function readServerListing(url = "arquivos/", prefix = "") {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const folderUrl = new URL(response.url);
  const page = new DOMParser().parseFromString(await response.text(), "text/html");
  const seen = new Set(), items = [];
  for (const link of page.querySelectorAll("a[href]")) {
    const target = new URL(link.getAttribute("href"), folderUrl);
    if (target.origin !== folderUrl.origin || target.pathname === folderUrl.pathname || !target.pathname.startsWith(folderUrl.pathname)) continue;
    const name = decodeURIComponent(target.pathname.slice(folderUrl.pathname.length).replace(/\/$/, ""));
    if (!name || name.startsWith(".") || name.includes("/") || seen.has(name)) continue;
    seen.add(name);
    const path = prefix + name;
    // O Live Server marca pastas pela classe; os demais servidores, pela barra final.
    if (target.pathname.endsWith("/") || link.classList.contains("icon-directory")) items.push(...await readServerListing(`${target.pathname.replace(/\/$/, "")}/`, `${path}/`));
    else items.push({ path, getFile: () => fetchFile(target.href) });
  }
  return items;
}

async function fetchFile(url) {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.blob();
}

function showFiles(items) {
  revokeObjectUrl();
  state.root = buildTree(items);
  state.total = items.length;
  state.selected = null;
  state.openFolders.clear();
  ui.fileFilter.value = "";
  ui.fileCount.textContent = `${state.total} arquivo${state.total === 1 ? "" : "s"}`;
  const first = firstFile(state.root);
  if (first) expandTo(first);
  renderTree();
  if (first) openFile(first);
  else showMessage("A pasta arquivos/ está vazia.");
}

function buildTree(items) {
  const root = createFolder("", "");
  for (const { path, getFile } of items) {
    const parts = path.split("/");
    const name = parts.pop();
    let folder = root;
    for (const part of parts) {
      if (!folder.folders.has(part)) folder.folders.set(part, createFolder(part, folder.path ? `${folder.path}/${part}` : part));
      folder = folder.folders.get(part);
      folder.count++;
    }
    folder.files.push(createFile(name, path, getFile));
  }
  return root;
}

function createFolder(name, path) { return { name, path, count: 0, folders: new Map(), files: [] }; }

function createFile(name, path, getFile) {
  const ext = (name.match(/\.([^.]+)$/)?.[1] || "").toLowerCase();
  return { name, path, ext, getFile };
}

const subfolders = (folder) => [...folder.folders.values()].sort(byName);
const filesOf = (folder) => [...folder.files].sort(byName);

function firstFile(folder) {
  const [next] = subfolders(folder);
  return next ? firstFile(next) : filesOf(folder)[0];
}

function expandTo(file) {
  const parts = file.path.split("/").slice(0, -1);
  parts.forEach((_, index) => state.openFolders.add(parts.slice(0, index + 1).join("/")));
}

function renderTree() {
  if (!state.root) return;
  const query = searchable(ui.fileFilter.value.trim());
  const nodes = renderChildren(state.root, query);
  if (nodes.length) { ui.fileList.replaceChildren(...nodes); return; }
  const empty = document.createElement("li");
  empty.className = "tree-empty";
  empty.textContent = "Nenhum arquivo encontrado.";
  ui.fileList.replaceChildren(empty);
}

function renderChildren(folder, query) {
  const nodes = [];
  for (const subfolder of subfolders(folder)) {
    const children = renderChildren(subfolder, query);
    if (children.length) nodes.push(folderNode(subfolder, children, query));
  }
  for (const file of filesOf(folder)) {
    if (searchable(file.path).includes(query)) nodes.push(fileNode(file));
  }
  return nodes;
}

function folderNode(folder, children, query) {
  const details = document.createElement("details");
  details.className = "tree-folder";
  details.open = Boolean(query) || state.openFolders.has(folder.path);
  const summary = document.createElement("summary");
  summary.title = folder.path;
  summary.innerHTML = `<span class="tree-chevron" aria-hidden="true">›</span><span class="tree-folder-name">${escapeHtml(folder.name)}</span><span class="tree-count" aria-label="${folder.count} arquivos">${folder.count}</span>`;
  summary.addEventListener("click", () => {
    if (query) return; // A abertura durante um filtro é temporária.
    if (details.open) state.openFolders.delete(folder.path);
    else state.openFolders.add(folder.path);
  });
  const list = document.createElement("ul");
  list.className = "tree-children";
  list.append(...children);
  details.append(summary, list);
  const item = document.createElement("li");
  item.append(details);
  return item;
}

function fileNode(file) {
  const button = document.createElement("button");
  button.type = "button"; button.className = "file-item"; button.title = file.path; button.dataset.path = file.path;
  button.setAttribute("aria-current", String(file === state.selected));
  button.innerHTML = `<span class="file-icon">${escapeHtml(file.ext.slice(0, 4).toUpperCase() || "•")}</span><span class="file-item-name">${escapeHtml(file.name)}</span>`;
  button.addEventListener("click", () => openFile(file));
  const item = document.createElement("li");
  item.append(button);
  return item;
}

function markSelected() {
  for (const button of ui.fileList.querySelectorAll(".file-item")) button.setAttribute("aria-current", String(button.dataset.path === state.selected?.path));
}

async function openFile(entry) {
  state.selected = entry;
  markSelected();
  ui.title.textContent = entry.name;
  ui.type.textContent = entry.ext.toUpperCase() || "ARQUIVO";
  disableDownload();
  ui.viewer.focus({ preventScroll: true });
  showLoading(`Abrindo ${entry.name}…`);
  try {
    const file = await entry.getFile();
    if (state.selected !== entry) return;
    revokeObjectUrl();
    // Sem o tipo correto o navegador baixa o PDF em vez de exibi-lo.
    const url = URL.createObjectURL(entry.ext === "pdf" ? file.slice(0, file.size, "application/pdf") : file);
    state.objectUrl = url;
    ui.download.href = url; ui.download.download = entry.name; ui.download.classList.remove("is-disabled"); ui.download.removeAttribute("aria-disabled");
    const view = await renderFile(entry, file, url);
    if (state.selected === entry) ui.viewer.replaceChildren(view);
  } catch (error) {
    console.error(error);
    if (state.selected === entry) showMessage("Não foi possível gerar a visualização deste arquivo.", "error");
  }
}

async function renderFile(entry, file, url) {
  if (!previewable.has(entry.ext)) return statusElement("Este tipo de arquivo não tem visualização aqui. Use o botão Baixar arquivo para abri-lo.");
  if (entry.ext === "pdf") return renderPdf(url);
  if (entry.ext === "docx") return renderDocx(await file.arrayBuffer());
  if (entry.ext === "pptx") return renderPptx(await file.arrayBuffer());
  return renderMarkdown(await file.text());
}

function renderPdf(url) { const frame = document.createElement("iframe"); frame.className = "pdf-frame"; frame.title = "Visualização do PDF"; frame.src = url; return frame; }

function renderMarkdown(text) {
  const lines = text.replace(/\r/g, "").split("\n"); let html = "", inCode = false, inList = false;
  for (const rawLine of lines) {
    const line = escapeHtml(rawLine);
    if (/^```/.test(rawLine)) { html += inCode ? "</code></pre>" : "<pre><code>"; inCode = !inCode; continue; }
    if (inCode) { html += `${line}\n`; continue; }
    if (/^###\s+/.test(rawLine)) html += `<h3>${inlineMarkdown(line.slice(4))}</h3>`;
    else if (/^##\s+/.test(rawLine)) html += `<h2>${inlineMarkdown(line.slice(3))}</h2>`;
    else if (/^#\s+/.test(rawLine)) html += `<h1>${inlineMarkdown(line.slice(2))}</h1>`;
    else if (/^>\s?/.test(rawLine)) html += `<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`;
    else if (/^[-*+]\s+/.test(rawLine)) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${inlineMarkdown(line.slice(2))}</li>`; }
    else { if (inList) { html += "</ul>"; inList = false; } if (rawLine.trim()) html += `<p>${inlineMarkdown(line)}</p>`; }
  }
  if (inList) html += "</ul>"; if (inCode) html += "</code></pre>";
  const page = document.createElement("article"); page.className = "document-page markdown-content"; page.innerHTML = html || "<p>Arquivo Markdown vazio.</p>"; return page;
}

function inlineMarkdown(value) { return value.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'); }

async function renderDocx(arrayBuffer) {
  if (!window.mammoth) throw new Error("Biblioteca DOCX indisponível");
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const page = document.createElement("article"); page.className = "document-page docx-content"; page.innerHTML = result.value || "<p>O documento não contém texto que possa ser exibido.</p>";
  if (result.messages.length) page.insertAdjacentHTML("beforeend", `<p class="render-note">Alguns elementos podem não ser reproduzidos exatamente como no Word.</p>`);
  return page;
}

async function renderPptx(arrayBuffer) {
  if (!window.JSZip) throw new Error("Biblioteca PPTX indisponível");
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slides = Object.keys(zip.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path)).sort((a, b) => Number(a.match(/\d+/g).pop()) - Number(b.match(/\d+/g).pop()));
  if (!slides.length) throw new Error("Nenhum slide encontrado");
  const deck = document.createElement("section"); deck.className = "pptx-deck"; deck.setAttribute("aria-label", "Slides extraídos da apresentação");
  for (let index = 0; index < slides.length; index++) {
    const xml = await zip.file(slides[index]).async("text");
    const documentXml = new DOMParser().parseFromString(xml, "application/xml");
    const paragraphs = [...documentXml.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "p")].map((paragraph) => [...paragraph.getElementsByTagNameNS("http://schemas.openxmlformats.org/drawingml/2006/main", "t")].map((node) => node.textContent).join("").trim()).filter(Boolean);
    const slide = document.createElement("article"); slide.className = "pptx-slide";
    slide.innerHTML = `<span class="pptx-number">SLIDE ${index + 1}</span>${paragraphs.length ? paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("") : "<p>Este slide não possui texto extraível.</p>"}`;
    deck.append(slide);
  }
  return deck;
}

function statusElement(message, kind = "") { const element = document.createElement("div"); element.className = `status ${kind}`; element.textContent = message; return element; }
function showLoading(message) { ui.viewer.innerHTML = `<div class="status"><span class="spinner" aria-hidden="true"></span>${escapeHtml(message)}</div>`; }
function showMessage(message, kind = "") { ui.viewer.replaceChildren(statusElement(message, kind)); }
function disableDownload() { ui.download.removeAttribute("href"); ui.download.classList.add("is-disabled"); ui.download.setAttribute("aria-disabled", "true"); }
function revokeObjectUrl() { if (state.objectUrl) URL.revokeObjectURL(state.objectUrl); state.objectUrl = null; }
