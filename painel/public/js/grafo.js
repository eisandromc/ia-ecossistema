'use strict';

/* ---------- hierarquia: o que está expandido ---------- */
// O grafo começa só com a raiz. Expandir um nó revela apenas os recursos que ele usa.
const USER = '__voce';
const NW = 212,
  NH = 78,
  GX = 28,
  GY = 74;
const ANIM_LAYOUT_MS = 420;
const ANIM_ENVELOPE_MS = 1000;
// A partir daqui o mapa precisa de ajuda para ser lido: consultas somem e a passagem do mouse destaca.
const GRAFO_GRANDE = 12;
const ZOOM_LONGE = 0.7;

/* ---------- título completo: a altura de cada nó vem do número de linhas ---------- */
const TITULO_LARGURA = 127; // do texto até o selo de estado, no canto do cartão
const TITULO = {
  perto: { fonte: '500 13px "IBM Plex Sans", system-ui, sans-serif', linha: 16 },
  longe: { fonte: '600 19px "IBM Plex Sans Condensed", "IBM Plex Sans", system-ui, sans-serif', linha: 23 },
};
const medidor = document.createElement('canvas').getContext('2d');
const linhasGuardadas = new Map();
function cortarPalavra(palavra) {
  const partes = [];
  let parte = '';
  for (const c of palavra) {
    if (parte && medidor.measureText(parte + c).width > TITULO_LARGURA) {
      partes.push(parte);
      parte = '';
    }
    parte += c;
  }
  return [...partes, parte];
}
function linhasDoTitulo(nome, modo) {
  const chave = `${modo}|${nome}`;
  if (linhasGuardadas.has(chave)) return linhasGuardadas.get(chave);
  medidor.font = TITULO[modo].fonte;
  const linhas = [];
  let atual = '';
  for (const palavra of String(nome).split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (medidor.measureText(tentativa).width <= TITULO_LARGURA) {
      atual = tentativa;
      continue;
    }
    if (atual) linhas.push(atual);
    const partes = cortarPalavra(palavra);
    linhas.push(...partes.slice(0, -1));
    atual = partes.at(-1);
  }
  if (atual) linhas.push(atual);
  linhasGuardadas.set(chave, linhas);
  return linhas;
}
// A altura vale para os dois modos, para o mapa não se reorganizar a cada zoom.
function alturaDe(id) {
  const n = byId(id);
  if (!n) return NH;
  const perto = NH + (linhasDoTitulo(n.nome, 'perto').length - 1) * TITULO.perto.linha;
  const longe = 50 + (linhasDoTitulo(n.nome, 'longe').length - 1) * TITULO.longe.linha;
  return Math.max(perto, longe);
}
const childrenOf = (id) => {
  const n = byId(id);
  return n ? n.usa.filter((u) => byId(u) && u !== id) : [];
};
const rootId = () => (byId(S.meta.raiz) ? S.meta.raiz : (S.nodes[0] || {}).id);

function visibleIds() {
  const vis = new Set();
  const st = [rootId(), ...S.extra];
  while (st.length) {
    const id = st.pop();
    if (id == null || vis.has(id) || !byId(id) || (S.foco && !S.foco.has(id))) continue;
    vis.add(id);
    if (S.expanded.has(id)) st.push(...childrenOf(id));
  }
  return vis;
}
function refreshTree(origin) {
  S.visible = visibleIds();
  renderTree();
  renderCanvasSub();
  return animateLayout(origin);
}
function expand(id) {
  if (!childrenOf(id).length || (S.expanded.has(id) && !S.foco)) return Promise.resolve();
  S.foco = null;
  S.expanded.add(id);
  return refreshTree(id);
}
function collapse(id) {
  S.foco = null;
  S.expanded.delete(id);
  const vis = visibleIds();
  for (const x of [...S.expanded]) if (!vis.has(x)) S.expanded.delete(x);
  return refreshTree(id);
}
const toggleExpand = (id) => (S.expanded.has(id) ? collapse(id) : expand(id));
function expandLevel() {
  S.foco = null;
  S.visible = visibleIds();
  const novos = [...S.visible].filter((id) => childrenOf(id).length && !S.expanded.has(id));
  if (!novos.length) return toast('Tudo já está expandido.', 'ok');
  novos.forEach((id) => S.expanded.add(id));
  refreshTree(rootId());
}
function expandAll() {
  S.foco = null;
  S.nodes.forEach((n) => S.expanded.add(n.id));
  const vis = visibleIds();
  S.nodes.forEach((n) => {
    if (!vis.has(n.id)) S.extra.add(n.id);
  });
  return refreshTree(rootId());
}
function collapseAll() {
  S.foco = null;
  S.expanded.clear();
  S.extra.clear();
  return refreshTree(rootId());
}
// Caminho da raiz até o recurso, para abrir só o que leva até ele.
function pathTo(id) {
  const root = rootId();
  const pai = new Map([[root, null]]);
  const fila = [root];
  while (fila.length) {
    const c = fila.shift();
    if (c === id) break;
    for (const u of childrenOf(c))
      if (!pai.has(u)) {
        pai.set(u, c);
        fila.push(u);
      }
  }
  if (!pai.has(id)) return null;
  const out = [];
  for (let x = pai.get(id); x != null; x = pai.get(x)) out.unshift(x);
  return out;
}
// Parte do grafo só com a raiz: a execução revela cada elemento que o roteamento e os planos escolherem.
function focarNaDemanda() {
  S.foco = new Set([rootId()]);
  S.expanded.clear();
  S.extra.clear();
  return refreshTree(rootId());
}
function reveal(id, via) {
  if (!byId(id)) return Promise.resolve();
  const novo = !!S.foco && !S.foco.has(id);
  S.foco?.add(id);
  if (via && byId(via) && byId(via).usa.includes(id) && S.visible.has(via)) {
    if (S.expanded.has(via) && !novo) return Promise.resolve();
    S.expanded.add(via);
    return refreshTree(via);
  }
  if (S.visible.has(id)) return Promise.resolve();
  const caminho = pathTo(id);
  if (caminho) {
    caminho.forEach((x) => {
      S.expanded.add(x);
      S.foco?.add(x);
    });
  } else S.extra.add(id);
  return refreshTree(caminho ? caminho[caminho.length - 1] : rootId());
}
async function focusNode(id) {
  await reveal(id);
  select(id);
  centerOn(id);
}

/* ---------- layout ---------- */
function layout() {
  S.visible = visibleIds();
  const lista = S.nodes.filter((n) => S.visible.has(n.id));
  const rows = {};
  for (const n of lista) (rows[ROW[n.tipo] ?? 3] ||= []).push(n);
  const used = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b);
  // ordem inicial: percurso a partir da raiz
  const order = {};
  let k = 0;
  (function dfs(id) {
    if (order[id] != null || !S.visible.has(id)) return;
    order[id] = k++;
    if (S.expanded.has(id)) childrenOf(id).forEach(dfs);
  })(rootId());
  lista.forEach((n) => (order[n.id] ??= k++));
  const x = {};
  const place = (list) => {
    const w = list.length * NW + (list.length - 1) * GX;
    list.forEach((n, i) => (x[n.id] = i * (NW + GX) - w / 2));
  };
  used.forEach((r) => {
    rows[r].sort((a, b) => order[a.id] - order[b.id]);
    place(rows[r]);
  });
  // aproxima cada nó de quem o chama, para reduzir cruzamentos
  for (let pass = 0; pass < 3; pass++) {
    used.forEach((r, i) => {
      if (i === 0) return;
      const media = (n) => {
        const us = usersOf(n.id).filter(
          (u) => S.expanded.has(u.id) && x[u.id] != null && (ROW[u.tipo] ?? 3) < r,
        );
        return us.length ? us.reduce((s, u) => s + x[u.id], 0) / us.length : x[n.id];
      };
      const v = Object.fromEntries(rows[r].map((n) => [n.id, media(n)]));
      rows[r].sort((a, b) => v[a.id] - v[b.id] || order[a.id] - order[b.id]);
      place(rows[r]);
    });
  }
  let y = 0;
  S.pos = {};
  S.bandY = null;
  used.forEach((r) => {
    if (r === 5) {
      y += 26;
      S.bandY = y - 18;
    }
    rows[r].forEach((n) => (S.pos[n.id] = { x: x[n.id], y }));
    const altura = Math.max(...rows[r].map((n) => alturaDe(n.id)));
    if (r === 5) S.bandAlt = altura;
    y += altura + GY;
  });
}

/* ---------- grafo ---------- */
const svg = $('#graph'),
  vp = $('#vp'),
  gE = $('#gEdges'),
  gN = $('#gNodes'),
  gB = $('#gBands'),
  gFx = $('#gFx');
function applyView() {
  vp.setAttribute('transform', `translate(${S.view.x} ${S.view.y}) scale(${S.view.k})`);
  svg.classList.toggle('longe', S.view.k < ZOOM_LONGE);
}
function edgePath(a, b) {
  const p = S.pos[a],
    q = S.pos[b];
  if (!p || !q) return '';
  const x1 = p.x + NW / 2,
    x2 = q.x + NW / 2;
  if (Math.abs(p.y - q.y) < 1) {
    const y = p.y + alturaDe(a);
    const d = Math.max(34, Math.abs(x2 - x1) * 0.22);
    return `M${x1} ${y} C${x1} ${y + d} ${x2} ${y + d} ${x2} ${y + 3}`;
  }
  if (q.y > p.y) {
    const y1 = p.y + alturaDe(a),
      y2 = q.y - 3,
      m = (y2 - y1) * 0.5;
    return `M${x1} ${y1} C${x1} ${y1 + m} ${x2} ${y2 - m} ${x2} ${y2}`;
  }
  const y1 = p.y,
    y2 = q.y + alturaDe(b) + 3;
  return `M${x1} ${y1} C${x1} ${y1 - 70} ${x2} ${y2 + 70} ${x2} ${y2}`;
}
function renderEdges() {
  let h = '';
  for (const n of S.nodes) {
    if (!S.visible.has(n.id) || !S.expanded.has(n.id)) continue;
    for (const u of n.usa) {
      const t = byId(u);
      if (!t || !S.visible.has(u)) continue;
      const key = `${n.id}>${u}`;
      const hl = S.sel && (S.sel === n.id || S.sel === u);
      h += `<path class="edge${TRANS.has(t.tipo) ? ' trans' : ''}${hl ? ' hl' : ''}${S.flow.has(key) ? ' flow' : ''}" data-e="${esc(key)}" d="${edgePath(n.id, u)}" marker-end="url(#${hl ? 'arrA' : 'arr'})"/>`;
    }
  }
  gE.innerHTML = h;
  gE.classList.toggle('sem-consulta', !S.verConsultas && S.visible.size >= GRAFO_GRANDE);
}
function userPoint() {
  const p = S.pos[rootId()];
  return p ? { x: p.x + NW / 2, y: p.y - 58 } : { x: 0, y: -58 };
}
function renderBands() {
  const up = userPoint();
  let h = `<path class="edge you" d="M${up.x} ${up.y + 20} L${up.x} ${up.y + 54}"/><g class="voce" transform="translate(${up.x} ${up.y})"><circle r="20"/><text class="em" y="6">🙋</text><text class="lb" x="28" y="5">Você</text></g>`;
  const tr = S.nodes.filter((n) => TRANS.has(n.tipo) && S.visible.has(n.id) && S.pos[n.id]);
  if (tr.length && S.bandY != null) {
    const xs = tr.map((n) => S.pos[n.id].x);
    const x0 = Math.min(...xs) - 24,
      x1 = Math.max(...xs) + NW + 24;
    h += `<g class="band"><rect x="${x0}" y="${S.bandY - 14}" width="${x1 - x0}" height="${(S.bandAlt ?? NH) + 52}" rx="10"/><text x="${x0 + 14}" y="${S.bandY + 4}">Consultados · skills e RAG</text></g>`;
  }
  gB.innerHTML = h;
}
function expSvg(n) {
  const kids = childrenOf(n.id).length;
  if (!kids) return '';
  const open = S.expanded.has(n.id);
  const nudge = !open && !S.expanded.size && n.id === rootId() ? ' nudge' : '';
  return `<g class="exp${nudge}" transform="translate(${NW / 2} ${alturaDe(n.id)})" aria-hidden="true"><circle r="13"/><text y="4.5">${open ? '−' : '+' + kids}</text></g>`;
}
function bubbleSvg(b) {
  const txt = clip(b.text, 32);
  const w = Math.min(NW + 44, 26 + [...txt].length * 6.7);
  const x = (NW - w) / 2;
  return `<g class="bub ${b.kind}"><rect x="${x}" y="-40" width="${w}" height="26" rx="13"/><path d="M${NW / 2 - 6} -15 L${NW / 2} -7 L${NW / 2 + 6} -15z"/><text x="${NW / 2}" y="-22.5">${esc(txt)}</text></g>`;
}
function nodeSvg(n, entrando) {
  const p = S.pos[n.id] || { x: 0, y: 0 };
  const t = TYPES[n.tipo] || TYPES.subagente;
  const b = S.bubbles[n.id];
  const apagado = S.busca && !casaBusca(n, S.busca);
  const altura = alturaDe(n.id);
  const titulo = linhasDoTitulo(n.nome, 'perto');
  const abaixo = 24 + (titulo.length - 1) * TITULO.perto.linha;
  const tituloLonge = linhasDoTitulo(n.nome, 'longe');
  const inicioLonge = Math.round((altura - (tituloLonge.length - 1) * TITULO.longe.linha) / 2 + 6);
  return `<g class="node${S.sel === n.id ? ' sel' : ''}${entrando ? ' enter' : ''}${apagado ? ' dim' : ''}" data-id="${esc(n.id)}" style="--c:${tcolor(n.tipo)}" transform="translate(${p.x} ${p.y})" tabindex="0" role="button" aria-label="${esc(t.label + ' ' + n.nome + ' (' + n.id + ')')}"${S.nstate[n.id] ? ` data-state="${S.nstate[n.id]}"` : ''}>
  <title>${esc(t.papel)}</title>
  <rect class="halo" x="-5" y="-5" width="${NW + 10}" height="${altura + 10}" rx="13"/>
  <rect class="card" width="${NW}" height="${altura}" rx="10"/>
  <rect class="badge" x="10" y="12" width="42" height="42" rx="10"/><text class="ava" x="31" y="40">${t.ava}</text>
  ${titulo.map((l, i) => `<text class="nm" x="62" y="${24 + i * TITULO.perto.linha}">${esc(l)}</text>`).join('')}
  <text class="nid" x="62" y="${abaixo + 17}">${esc(clip(n.id, 20))}</text>
  <text class="nmod" x="62" y="${abaixo + 36}">${esc(rotuloNo(n))}</text>
  ${tituloLonge.map((l, i) => `<text class="nl" x="62" y="${inicioLonge + i * TITULO.longe.linha}">${esc(l)}</text>`).join('')}
  <g class="st" transform="translate(${NW - 16} 16)"><circle r="6.5"/><path d="M-3 0l2 2 4-4"/></g>${expSvg(n)}${b ? bubbleSvg(b) : ''}</g>`;
}
function renderNodes(novos) {
  // Trocar o HTML derruba o foco: quem navega pelo teclado perderia o lugar a cada expansão.
  const foco = document.activeElement?.closest?.('.node')?.dataset.id;
  gN.innerHTML = S.nodes
    .filter((n) => S.visible.has(n.id))
    .map((n) => nodeSvg(n, novos && novos.has(n.id)))
    .join('');
  if (foco) gN.querySelector(`.node[data-id="${CSS.escape(foco)}"]`)?.focus({ preventScroll: true });
}
function renderGraph() {
  S.visible = visibleIds();
  if ([...S.visible].some((id) => !S.pos[id])) layout();
  renderBands();
  renderEdges();
  renderNodes();
  applyView();
  renderLegend();
  renderCanvasSub();
}
function renderCanvasSub() {
  const el = $('#canvasSub');
  if (!el) return;
  el.textContent = `${S.visible.size} de ${S.nodes.length}`;
  el.title = `${el.textContent} recursos à vista`;
}
function renderLegend() {
  const present = TYPE_ORDER.filter((t) => S.nodes.some((n) => n.tipo === t));
  $('#legend').innerHTML =
    present
      .map((t) => {
        const qtd = S.nodes.filter((n) => n.tipo === t).length;
        return `<span title="${esc(TYPES[t].papel)}">${TYPES[t].ava} ${TYPES[t].label} (${qtd})</span>`;
      })
      .join('') + '<span><span class="ln"></span>delega</span><span><span class="ln d"></span>consulta</span>';
}
function viewToFit() {
  const r = svg.getBoundingClientRect();
  const xs = Object.values(S.pos);
  if (!r.width || !xs.length) return { ...S.view };
  const x0 = Math.min(...xs.map((p) => p.x)) - 34,
    x1 = Math.max(...xs.map((p) => p.x)) + NW + 34,
    y0 = Math.min(...xs.map((p) => p.y)) - 96,
    y1 = Math.max(...Object.entries(S.pos).map(([id, p]) => p.y + alturaDe(id))) + 44;
  const k = Math.max(0.25, Math.min(1.15, r.width / (x1 - x0), r.height / (y1 - y0)));
  return { k, x: (r.width - (x1 - x0) * k) / 2 - x0 * k, y: (r.height - (y1 - y0) * k) / 2 - y0 * k };
}
function fit() {
  camTok++;
  S.view = viewToFit();
  applyView();
}
let animTok = 0;
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const mix = (a, b, e) => a + (b - a) * e;
// Reorganiza com movimento: os novos nós saem de dentro de quem foi expandido.
function animateLayout(origin) {
  const antes = { ...S.pos },
    vAntes = { ...S.view };
  const tok = ++animTok;
  camTok++;
  layout();
  const alvo = S.pos;
  // Quem assumiu a câmera no meio da execução não deve ser levado de volta ao enquadramento geral.
  const vAlvo = S.run?.camLivre && emExecucao() ? vAntes : viewToFit();
  const novos = new Set(Object.keys(alvo).filter((id) => !antes[id]));
  const base = antes[origin] || alvo[origin] || { x: 0, y: 0 };
  if (reduced || document.hidden) {
    S.view = vAlvo;
    renderBands();
    renderEdges();
    renderNodes();
    applyView();
    return Promise.resolve();
  }
  const inicio = {};
  for (const id of Object.keys(alvo)) inicio[id] = antes[id] || base;
  S.pos = { ...inicio };
  renderNodes(novos);
  const els = {};
  gN.querySelectorAll('.node').forEach((el) => (els[el.dataset.id] = el));
  return new Promise((pronto) => {
    const t0 = performance.now();
    const fim = () => {
      if (tok === animTok) {
        S.pos = alvo;
        S.view = vAlvo;
        Object.entries(els).forEach(([id, el]) =>
          el.setAttribute('transform', `translate(${alvo[id].x} ${alvo[id].y})`),
        );
        renderBands();
        renderEdges();
        applyView();
      }
      pronto();
    };
    // rAF para em aba oculta; o temporizador garante que a execução não trave.
    const guarda = setTimeout(fim, ANIM_LAYOUT_MS + 200);
    (function step(t) {
      if (tok !== animTok) {
        clearTimeout(guarda);
        return pronto();
      }
      const p = Math.min(1, (t - t0) / ANIM_LAYOUT_MS),
        e = easeOut(p);
      for (const [id, el] of Object.entries(els)) {
        const a = inicio[id],
          b = alvo[id];
        S.pos[id] = { x: mix(a.x, b.x, e), y: mix(a.y, b.y, e) };
        el.setAttribute('transform', `translate(${S.pos[id].x} ${S.pos[id].y})`);
      }
      S.view = { k: mix(vAntes.k, vAlvo.k, e), x: mix(vAntes.x, vAlvo.x, e), y: mix(vAntes.y, vAlvo.y, e) };
      renderBands();
      renderEdges();
      applyView();
      if (p < 1) requestAnimationFrame(step);
      else {
        clearTimeout(guarda);
        fim();
      }
    })(t0);
  });
}
/* ---------- câmera: acompanha a chamada para ela não virar um pontinho ---------- */
const ANIM_CAMERA_MS = 380;
let camTok = 0;
function moverVista(alvo, ms = ANIM_CAMERA_MS) {
  const tok = ++camTok;
  if (reduced || document.hidden) {
    S.view = alvo;
    return applyView();
  }
  const de = { ...S.view };
  const t0 = performance.now();
  (function step(t) {
    if (tok !== camTok) return;
    const p = Math.min(1, Math.max(0, (t - t0) / ms)),
      e = easeOut(p);
    S.view = { k: mix(de.k, alvo.k, e), x: mix(de.x, alvo.x, e), y: mix(de.y, alvo.y, e) };
    applyView();
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}
function assumirCamera() {
  camTok++;
  if (emExecucao()) S.run.camLivre = true;
}
function seguir(a, b) {
  if (!$('#optCam').checked || !S.run || S.run.camLivre) return;
  const pts = [centroDe(a), centroDe(b)].filter(Boolean);
  const r = svg.getBoundingClientRect();
  if (!pts.length || !r.width) return;
  const xs = pts.map((p) => p.x),
    ys = pts.map((p) => p.y),
    meia = Math.max(alturaDe(a), alturaDe(b)) / 2;
  const x0 = Math.min(...xs) - NW / 2 - 50,
    x1 = Math.max(...xs) + NW / 2 + 50,
    y0 = Math.min(...ys) - meia - 62,
    y1 = Math.max(...ys) + meia + 44;
  const k = Math.max(0.3, Math.min(1, r.width / (x1 - x0), r.height / (y1 - y0)));
  moverVista({ k, x: r.width / 2 - ((x0 + x1) / 2) * k, y: r.height / 2 - ((y0 + y1) / 2) * k }, ANIM_CAMERA_MS / S.speed);
}
function zoomBy(f, cx, cy) {
  assumirCamera();
  const r = svg.getBoundingClientRect();
  cx ??= r.width / 2;
  cy ??= r.height / 2;
  const k2 = Math.max(0.2, Math.min(2.6, S.view.k * f));
  S.view.x = cx - (cx - S.view.x) * (k2 / S.view.k);
  S.view.y = cy - (cy - S.view.y) * (k2 / S.view.k);
  S.view.k = k2;
  applyView();
}
function setState(id, st) {
  if (!id) return;
  if (st) S.nstate[id] = st;
  else delete S.nstate[id];
  const el = gN.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
  if (el) {
    if (st) el.dataset.state = st;
    else delete el.dataset.state;
  }
  $$(`#resList .res-item[data-id="${CSS.escape(id)}"]`).forEach((li) => {
    if (st) li.dataset.state = st;
    else delete li.dataset.state;
  });
}

/* ---------- balões de fala ---------- */
const bubTimers = {};
function bubble(id, text, kind = 'fala', ms = 2600) {
  clearTimeout(bubTimers[id]);
  S.bubbles[id] = { text, kind };
  paintBubble(id);
  if (ms) bubTimers[id] = setTimeout(() => clearBubble(id), ms);
}
function clearBubble(id) {
  delete S.bubbles[id];
  paintBubble(id);
}
function clearBubbles() {
  Object.keys(S.bubbles).forEach(clearBubble);
}
function paintBubble(id) {
  const el = gN.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
  if (!el) return;
  el.querySelector('.bub')?.remove();
  if (S.bubbles[id]) el.insertAdjacentHTML('beforeend', bubbleSvg(S.bubbles[id]));
}

/* ---------- envelopes: a chamada viajando pelo grafo ---------- */
const ENVELOPE = { handoff: '✉️', retorno: '✅', consulta: '🔎' };
function centroDe(id) {
  if (id == null) return userPoint();
  const p = S.pos[id];
  return p ? { x: p.x + NW / 2, y: p.y + alturaDe(id) / 2 } : null;
}
function fly(a, b, tipo, rotulo) {
  if (!S.run || !$('#optAnim').checked) return Promise.resolve();
  seguir(a, b);
  const ida = `${a}>${b}`,
    volta = `${b}>${a}`;
  const chave = gE.querySelector(`[data-e="${CSS.escape(ida)}"]`) ? ida : volta;
  const invertido = chave === volta;
  S.flow.add(chave);
  gE.querySelector(`[data-e="${CSS.escape(chave)}"]`)?.classList.add('flow');
  const solta = () => {
    S.flow.delete(chave);
    gE.querySelector(`[data-e="${CSS.escape(chave)}"]`)?.classList.remove('flow');
  };
  if (reduced || document.hidden) {
    setTimeout(solta, 500);
    return Promise.resolve();
  }
  const D = (tipo === 'consulta' ? 0.6 : 1) * (ANIM_ENVELOPE_MS / S.speed);
  gFx.insertAdjacentHTML(
    'beforeend',
    `<g class="pkt ${tipo}"><circle r="15"/><text class="em" y="5">${ENVELOPE[tipo] || '✉️'}</text>${rotulo ? `<text class="lb" y="29">${esc(rotulo)}</text>` : ''}</g>`,
  );
  const g = gFx.lastElementChild;
  return new Promise((pronto) => {
    const t0 = performance.now();
    const fim = () => {
      g.remove();
      solta();
      pronto();
    };
    const guarda = setTimeout(fim, D + 300);
    (function step(t) {
      const e = Math.min(1, (t - t0) / D);
      const path = gE.querySelector(`[data-e="${CSS.escape(chave)}"]`);
      let pt = null;
      if (path && path.getAttribute('d')) {
        const L = path.getTotalLength();
        pt = path.getPointAtLength(L * (invertido ? 1 - e : e));
      } else {
        const c1 = centroDe(a),
          c2 = centroDe(b);
        if (c1 && c2) pt = { x: mix(c1.x, c2.x, e), y: mix(c1.y, c2.y, e) };
      }
      if (pt) g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      if (e < 1) requestAnimationFrame(step);
      else {
        clearTimeout(guarda);
        fim();
      }
    })(t0);
  });
}

/* ---------- interação no canvas ---------- */
let drag = null;
svg.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  const el = e.target.closest('.node');
  try {
    svg.setPointerCapture(e.pointerId);
  } catch {}
  drag = {
    id: el ? el.dataset.id : null,
    exp: !!e.target.closest('.exp'),
    sx: e.clientX,
    sy: e.clientY,
    o: el ? { ...S.pos[el.dataset.id] } : { ...S.view },
    moved: false,
  };
  if (!el) svg.classList.add('panning');
});
svg.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.sx,
    dy = e.clientY - drag.sy;
  if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
  if (!drag.moved) return;
  if (drag.id) {
    S.pos[drag.id] = { x: drag.o.x + dx / S.view.k, y: drag.o.y + dy / S.view.k };
    gN.querySelector(`.node[data-id="${CSS.escape(drag.id)}"]`)?.setAttribute(
      'transform',
      `translate(${S.pos[drag.id].x} ${S.pos[drag.id].y})`,
    );
    renderEdges();
    renderBands();
  } else {
    assumirCamera();
    S.view.x = drag.o.x + dx;
    S.view.y = drag.o.y + dy;
    applyView();
  }
});
svg.addEventListener('pointerup', () => {
  if (!drag) return;
  svg.classList.remove('panning');
  if (!drag.moved) {
    if (drag.id && drag.exp) toggleExpand(drag.id);
    else if (drag.id) onNodeClick(drag.id);
    else if (!S.link) select(null);
  }
  drag = null;
});
svg.addEventListener('pointercancel', () => {
  svg.classList.remove('panning');
  drag = null;
});
svg.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    zoomBy(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  },
  { passive: false },
);
gN.addEventListener('keydown', (e) => {
  const el = e.target.closest('.node');
  if (!el) return;
  const id = el.dataset.id;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    onNodeClick(id);
  } else if (e.key === 'ArrowRight' || e.key === '+') {
    e.preventDefault();
    expand(id);
  } else if (e.key === 'ArrowLeft' || e.key === '-') {
    e.preventDefault();
    if (S.expanded.has(id)) collapse(id);
  }
});
function onNodeClick(id) {
  if (S.link) {
    if (!S.linkFrom) {
      S.linkFrom = id;
      $('#linkHint').textContent = `Origem: ${id}. Agora clique no destino.`;
      select(id, false);
      return;
    }
    addEdge(S.linkFrom, id);
    S.linkFrom = null;
    $('#linkHint').textContent = 'Clique no recurso de origem.';
    return;
  }
  select(id);
  rtab('insp');
}
function select(id) {
  S.sel = id;
  gN.querySelectorAll('.node').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
  renderEdges();
  $$('#resList .res-item').forEach((el) => el.classList.toggle('sel', el.dataset.id === id));
  renderInspector();
}
function centerOn(id) {
  const p = S.pos[id];
  if (!p) return;
  camTok++;
  const r = svg.getBoundingClientRect();
  S.view.x = r.width / 2 - (p.x + NW / 2) * S.view.k;
  S.view.y = r.height / 2 - (p.y + alturaDe(id) / 2) * S.view.k;
  applyView();
}

/* ---------- destaque das ligações do nó sob o mouse ---------- */
function realcar(id) {
  const ligado = !!id && S.visible.size >= GRAFO_GRANDE && !emExecucao();
  gE.classList.toggle('realce', ligado);
  gN.classList.toggle('realce', ligado);
  if (!ligado) return;
  const vizinhos = new Set([id]);
  gE.querySelectorAll('[data-e]').forEach((p) => {
    const [a, b] = p.dataset.e.split('>');
    const toca = a === id || b === id;
    p.classList.toggle('on', toca);
    if (toca) vizinhos.add(a).add(b);
  });
  gN.querySelectorAll('.node').forEach((el) => el.classList.toggle('viz', vizinhos.has(el.dataset.id)));
}
gN.addEventListener('pointerover', (e) => realcar(e.target.closest('.node')?.dataset.id));
gN.addEventListener('pointerleave', () => realcar(null));
$('#optConsultas').addEventListener('change', (e) => {
  S.verConsultas = e.target.checked;
  renderEdges();
});

// As fontes da web chegam depois do primeiro desenho e mudam a largura do texto.
document.fonts?.ready.then(() => {
  linhasGuardadas.clear();
  if (!S.nodes.length || emExecucao()) return;
  layout();
  renderGraph();
  fit();
});
