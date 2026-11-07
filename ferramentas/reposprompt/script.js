const state = { files: [], current: null, content: "", fontSize: 16, mode: "code" };
const elements = {
  fileList: document.querySelector("#fileList"), fileCounter: document.querySelector("#fileCounter"), searchInput: document.querySelector("#searchInput"),
  promptTitle: document.querySelector("#promptTitle"), filePath: document.querySelector("#filePath"), codeView: document.querySelector("#codeView"),
  previewView: document.querySelector("#previewView"), codeMode: document.querySelector("#codeMode"), previewMode: document.querySelector("#previewMode"),
  copyButton: document.querySelector("#copyButton"), decreaseFont: document.querySelector("#decreaseFont"), increaseFont: document.querySelector("#increaseFont"),
  themeButton: document.querySelector("#themeButton"), toast: document.querySelector("#toast")
};

const escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2600); }

function highlightMarkdown(text) {
  const tokens = /```[\s\S]*?```|`[^`\n]*`|^#{1,6}\s.*$|^\s*(?:[-*+]\s|\d+\.\s).*$|^>\s.*$|\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]]+\]\([^\)]+\)|^---+$/gm;
  let html = "", cursor = 0, match;
  while ((match = tokens.exec(text))) {
    html += escapeHtml(text.slice(cursor, match.index));
    const token = match[0]; let type = "md-strong";
    if (token.startsWith("```")) type = "md-code-block";
    else if (token.startsWith("`")) type = "md-code";
    else if (token.startsWith("#")) type = "md-heading";
    else if (/^\s*(?:[-*+]\s|\d+\.\s)/.test(token)) type = "md-list";
    else if (token.startsWith(">")) type = "md-quote";
    else if (token.startsWith("[")) type = "md-link";
    else if (/^---+$/.test(token)) type = "md-rule";
    html += `<span class="${type}">${escapeHtml(token)}</span>`;
    cursor = tokens.lastIndex;
  }
  return html + escapeHtml(text.slice(cursor));
}

function inlineMarkdown(value) {
  let text = escapeHtml(value);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/__([^_]+)__/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>").replace(/_([^_]+)_/g, "<em>$1</em>");
  return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function renderMarkdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n"); let html = "", i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) { const language = line.slice(3).trim(), block = []; i++; while (i < lines.length && !/^```/.test(lines[i])) block.push(lines[i++]); if (i < lines.length) i++; html += `<pre><code data-language="${escapeHtml(language)}">${escapeHtml(block.join("\n"))}</code></pre>`; continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/); if (heading) { const level = heading[1].length; html += `<h${level}>${inlineMarkdown(heading[2])}</h${level}>`; i++; continue; }
    if (/^---+$/.test(line.trim())) { html += "<hr>"; i++; continue; }
    if (/^>\s?/.test(line)) { const quote = []; while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, "")); html += `<blockquote>${inlineMarkdown(quote.join(" "))}</blockquote>`; continue; }
    const unordered = line.match(/^\s*[-*+]\s+(.+)$/), ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (unordered || ordered) { const isOrdered = Boolean(ordered), items = []; while (i < lines.length) { const found = lines[i].match(isOrdered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/); if (!found) break; items.push(`<li>${inlineMarkdown(found[1])}</li>`); i++; } html += isOrdered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`; continue; }
    if (!line.trim()) { i++; continue; }
    const paragraph = []; while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|>|\s*[-*+]\s|\s*\d+\.\s|---+$)/.test(lines[i])) paragraph.push(lines[i++]); html += `<p>${inlineMarkdown(paragraph.join(" "))}</p>`;
  }
  return html || "<p>Este arquivo está vazio.</p>";
}

function renderList() {
  const filter = elements.searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const visible = state.files.filter((file) => `${file.title || ""} ${file.path || ""}`.toLocaleLowerCase("pt-BR").includes(filter));
  if (!visible.length) { elements.fileList.innerHTML = '<div class="empty-list"><span aria-hidden="true">⌕</span><p>Nenhum prompt encontrado.</p><small>Verifique a busca ou o arquivo index.json.</small></div>'; return; }
  elements.fileList.replaceChildren(...visible.map((file) => {
    const button = document.createElement("button"); button.type = "button"; button.className = `file-button${state.current === file ? " active" : ""}`;
    button.innerHTML = '<span class="file-name"></span><span class="file-folder"></span>';
    button.querySelector(".file-name").textContent = file.title || file.path.split("/").pop(); button.querySelector(".file-folder").textContent = file.path;
    button.addEventListener("click", () => openFile(file)); return button;
  }));
}

async function openFile(file) {
  state.current = file; elements.promptTitle.textContent = file.title || file.path.split("/").pop(); elements.filePath.textContent = `PASTA FIXA · ${file.path.toUpperCase()}`;
  elements.codeView.textContent = "Carregando arquivo…"; elements.previewView.innerHTML = ""; renderList();
  try { const response = await fetch(`./prompts/${file.path}`); if (!response.ok) throw new Error("Arquivo não encontrado"); state.content = await response.text(); elements.codeView.innerHTML = highlightMarkdown(state.content); elements.previewView.innerHTML = renderMarkdown(state.content); elements.copyButton.disabled = false; elements.decreaseFont.disabled = false; elements.increaseFont.disabled = false; }
  catch { state.content = ""; elements.codeView.textContent = "Não foi possível carregar este arquivo. Verifique o caminho informado em prompts/index.json."; elements.copyButton.disabled = true; }
}

function setMode(mode) { const showCode = mode === "code"; elements.codeView.hidden = !showCode; elements.previewView.hidden = showCode; elements.codeMode.classList.toggle("active", showCode); elements.previewMode.classList.toggle("active", !showCode); elements.codeMode.setAttribute("aria-selected", String(showCode)); elements.previewMode.setAttribute("aria-selected", String(!showCode)); }
function updateFontSize(change) { state.fontSize = Math.min(24, Math.max(12, state.fontSize + change)); document.documentElement.style.setProperty("--reader-size", `${state.fontSize}px`); }

async function loadLibrary() {
  try { const response = await fetch("./prompts/index.json"); if (!response.ok) throw new Error("Índice não encontrado"); const data = await response.json(); state.files = Array.isArray(data.prompts) ? data.prompts : []; elements.fileCounter.textContent = `${state.files.length} prompt${state.files.length === 1 ? "" : "s"}`; renderList(); if (state.files.length) await openFile(state.files[0]); else throw new Error("Biblioteca vazia"); }
  catch { elements.fileCounter.textContent = "Biblioteca indisponível"; elements.promptTitle.textContent = "Não foi possível abrir a pasta prompts/"; elements.codeView.textContent = "Crie prompts/index.json e informe os arquivos Markdown que deseja listar."; elements.previewView.innerHTML = "<p>Crie prompts/index.json e informe os arquivos Markdown que deseja listar.</p>"; }
}

elements.searchInput.addEventListener("input", renderList); elements.codeMode.addEventListener("click", () => setMode("code")); elements.previewMode.addEventListener("click", () => setMode("preview")); elements.decreaseFont.addEventListener("click", () => updateFontSize(-1)); elements.increaseFont.addEventListener("click", () => updateFontSize(1));
elements.copyButton.addEventListener("click", async () => { try { await navigator.clipboard.writeText(state.content); showToast("Conteúdo copiado para a área de transferência."); } catch { showToast("Não foi possível copiar o conteúdo."); } });
elements.themeButton.addEventListener("click", () => { const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = next; localStorage.setItem("prompt-listador-theme", next); });
const savedTheme = localStorage.getItem("prompt-listador-theme"); if (savedTheme) document.documentElement.dataset.theme = savedTheme;
loadLibrary();
