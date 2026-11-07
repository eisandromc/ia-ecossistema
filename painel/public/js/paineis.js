'use strict';

/* ---------- painéis laterais ---------- */
function renderAll() {
  renderGraph();
  renderSide();
  renderInspector();
  renderTelemetry();
}
function renderSide() {
  $('#ecoName').textContent = S.meta.nome || 'Ecossistema';
  $('#ecoVer').textContent = 'v' + (S.meta.versao || '1.0.0');
  const c = {};
  S.nodes.forEach((n) => (c[n.tipo] = (c[n.tipo] || 0) + 1));
  const tipos = TYPE_ORDER.filter((t) => c[t]).map((t) => {
    const nome = c[t] === 1 ? TYPES[t].label : TYPES[t].plural;
    return `${c[t]} ${t === 'rag' ? nome : nome.toLowerCase()}`;
  });
  $('#ecoCount').textContent = [`${S.nodes.length} recursos`, ...tipos].join(' · ');
  renderTree();
  const iss = validate();
  const ne = iss.filter((i) => i.sev === 'e').length,
    nw = iss.length - ne;
  const b = $('#valBadge');
  b.className = 'chip ' + (ne ? 'crit' : nw ? 'warn' : 'ok');
  const plural = (n, nome) => `${n} ${nome}${n > 1 ? 's' : ''}`;
  b.textContent = [ne && plural(ne, 'erro'), nw && plural(nw, 'aviso')].filter(Boolean).join(' · ') || 'Aprovado';
  const html = iss.length ? gruposValidacao(iss) : '<p class="val-ok">Nenhum problema: ids, ligações, seções e fontes conferem.</p>';
  // Refazer a lista fecharia os grupos que a pessoa abriu.
  if (html !== ultimaValidacao) $('#valList').innerHTML = ultimaValidacao = html;
}
let ultimaValidacao = '';
// Agrupa pela mensagem, com os erros primeiro: dezenas de linhas iguais escondem o que importa.
function gruposValidacao(iss) {
  const grupos = new Map();
  for (const i of [...iss].sort((a, b) => (a.sev === b.sev ? 0 : a.sev === 'e' ? -1 : 1))) {
    const chave = i.m.replace(/\s*\([^)]*\)$/, '');
    if (!grupos.has(chave)) grupos.set(chave, { sev: i.sev, ids: [] });
    grupos.get(chave).ids.push(i.id);
  }
  return [...grupos]
    .map(
      ([msg, g]) =>
        `<details class="val-g"><summary><span class="sev${g.sev === 'w' ? ' w' : ''}"></span><span class="val-msg">${esc(msg)}</span><span class="val-n">${g.ids.length}</span></summary>${[...new Set(g.ids)].map((id) => `<button class="val-item" data-id="${esc(id)}">${esc(nomeDe(id))}<small>${esc(id)}</small></button>`).join('')}</details>`,
    )
    .join('');
}
function itemHtml(n) {
  const t = TYPES[n.tipo];
  return `<button class="res-item${S.sel === n.id ? ' sel' : ''}" data-id="${esc(n.id)}"${S.nstate[n.id] ? ` data-state="${S.nstate[n.id]}"` : ''} title="${esc(t.papel)}"><span class="ava">${t.ava}</span><span class="nm">${esc(n.nome)}</span><span class="sdot"></span></button>`;
}
// Árvore a partir da raiz: mostra só o que já foi expandido, como o grafo.
function treeHtml(id, nivel, caminho) {
  const n = byId(id);
  if (!n || caminho.has(id)) return '';
  // Durante uma demanda, a árvore mostra os mesmos elementos que o mapa.
  const kids = childrenOf(id).filter((k) => !S.foco || S.foco.has(k));
  const open = S.expanded.has(id);
  const seta = kids.length
    ? `<button class="tw" data-tw="${esc(id)}" aria-expanded="${open}" aria-label="${open ? 'Recolher' : 'Expandir'} ${esc(n.nome)}">${open ? '▾' : '▸'}<small>${kids.length}</small></button>`
    : '<span class="tw none"></span>';
  let h = `<div class="tree-row" style="--d:${nivel}">${seta}${itemHtml(n)}</div>`;
  if (open) {
    const prox = new Set(caminho).add(id);
    h += kids.map((k) => treeHtml(k, nivel + 1, prox)).join('');
  }
  return h;
}
function renderTree() {
  const q = $('#search').value.trim().toLowerCase();
  const casa = (n) => casaBusca(n, q);
  S.busca = q;
  let h = '';
  if (q) {
    for (const t of TYPE_ORDER) {
      const list = S.nodes.filter((n) => n.tipo === t && casa(n));
      if (!list.length) continue;
      h += `<div class="res-group"><span>${TYPES[t].plural}</span><span>${list.length}</span></div>`;
      h += list.map(itemHtml).join('');
    }
  } else h = [rootId(), ...S.extra].map((id) => treeHtml(id, 0, new Set())).join('');
  $('#resList').innerHTML = h || '<p class="empty">Nenhum recurso encontrado.</p>';
  gN.querySelectorAll('.node').forEach((el) => {
    const n = byId(el.dataset.id);
    el.classList.toggle('dim', !!q && !!n && !casa(n));
  });
}
$('#resList').addEventListener('click', (e) => {
  const tw = e.target.closest('[data-tw]');
  if (tw) return void toggleExpand(tw.dataset.tw);
  const b = e.target.closest('.res-item');
  if (!b) return;
  focusNode(b.dataset.id);
  rtab('insp');
});
$('#valList').addEventListener('click', (e) => {
  const b = e.target.closest('.val-item');
  if (!b || !byId(b.dataset.id)) return;
  focusNode(b.dataset.id);
  rtab('insp');
});
$('#search').addEventListener('input', renderTree);

// Mudar de aba reabre o painel direito, menos no Inspetor: clicar em um nó não tira o mapa da tela cheia.
function rtab(name, revelar = name !== 'insp') {
  if (revelar) mostrarPainel('dir');
  $$('[data-rtab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.rtab === name)));
  ['prompt', 'ent', 'insp', 'conn'].forEach((p) => ($('#pane' + p).hidden = p !== name));
  renderEntregaveis();
}
$$('[data-rtab]').forEach((b) => b.addEventListener('click', () => rtab(b.dataset.rtab)));

/* inspetor */
let confirmDel = false;
function nodeStats(id) {
  const cs = (S.run ? S.run.calls : []).filter((c) => c.node === id && c.end != null);
  return {
    n: cs.length,
    lat: cs.length ? cs.reduce((s, c) => s + (c.end - c.start), 0) / cs.length : null,
    tok: cs.reduce((s, c) => s + c.tin + c.tout, 0),
    est: cs.some((c) => c.est),
  };
}
function renderInspector() {
  const el = $('#paneinsp');
  const n = byId(S.sel);
  // O inspetor é redesenhado ao fim de cada execução: não pode levar junto o texto em edição.
  const ed = $('#editor');
  const rascunho = n && ed && ed.dataset.id === n.id && ed.value !== ed.defaultValue ? ed.value : null;
  confirmDel = false;
  if (!n) {
    el.innerHTML = `<p class="hint-txt">Selecione um recurso no grafo ou na árvore para ver o papel, o modelo, o arquivo e a telemetria dele.</p><div class="note">No canvas: o <b>+</b> expande o que está abaixo, arrastar move os cartões e rolar aproxima. Com o foco em um cartão, as setas → e ← expandem e recolhem. <b>Ligar</b> cria uma chamada nova; o painel bloqueia ligações que a matriz de chamadas não permite.</div>`;
    return;
  }
  const st = nodeStats(n.id);
  const users = usersOf(n.id);
  const chip = (id, rm) => {
    const m = byId(id);
    return `<span class="rchip" data-go="${esc(id)}"><span class="bdg" style="--c:${m ? tcolor(m.tipo) : 'var(--crit)'}">${m ? TYPES[m.tipo].abbr : '??'}</span>${esc(id)}${rm ? `<button class="x" data-rm="${esc(id)}" aria-label="Remover ligação com ${esc(id)}">×</button>` : ''}</span>`;
  };
  el.innerHTML = `<div class="insp-h"><span class="ava-g" style="--c:${tcolor(n.tipo)}">${TYPES[n.tipo].ava}</span><div style="min-width:0"><h3>${esc(n.nome)}</h3><div class="id">${esc(n.id)}</div></div></div>
  <p class="papel">${esc(TYPES[n.tipo].papel)}</p>
  ${fazChamada(n) ? `<label class="fld">Modelo deste recurso<select id="noModelo">${opcoesModelo(ESCOLHA.no[n.id] || '', `Herdar do nível: ${valorAlvo(herdado(n.tipo)).replace(/^sim$/, 'Simulação')}`)}</select></label>` : '<p class="hint-txt">Este recurso não chama o modelo: o conteúdo dele entra no contexto de quem o consulta.</p>'}
  <dl class="meta"><dt>Tipo</dt><dd>${TYPES[n.tipo].label}</dd><dt>Arquivo</dt><dd>${esc(n.arquivo)}</dd><dt>Pode chamar</dt><dd>${CAN_USE[n.tipo].map((t) => TYPES[t].plural).join(', ') || 'ninguém (é consultado)'}</dd></dl>
  <div class="rel"><h4>Usa (${n.usa.length})</h4><div class="chips">${n.usa.map((u) => chip(u, true)).join('') || '<span class="hint-txt">Nenhuma ligação.</span>'}</div></div>
  <div class="rel"><h4>Usado por (${users.length})</h4><div class="chips">${users.map((u) => chip(u.id, false)).join('') || '<span class="hint-txt">Ninguém.</span>'}</div></div>
  <div class="stats"><div><div class="l">Chamadas</div><div class="v">${st.n}</div></div><div><div class="l">Latência média</div><div class="v">${fmtMs(st.lat)}</div></div><div><div class="l">Tokens</div><div class="v">${st.est && st.tok ? '≈' : ''}${fmtN(st.tok)}</div></div></div>
  <label class="fld">Arquivo do recurso<textarea id="editor" data-id="${esc(n.id)}" spellcheck="false">${esc(S.files[n.arquivo] ?? '')}</textarea></label>
  <div class="row-btns"><button class="btn primary" id="btnSave">Salvar arquivo</button>${['dominio', 'orquestrador', 'workflow', 'agente', 'multiagentes', 'subagente'].includes(n.tipo) ? '<button class="btn" id="btnRunHere">Executar a partir daqui</button>' : ''}<button class="btn danger" id="btnDel">Excluir recurso</button></div>`;
  if (rascunho != null) $('#editor').value = rascunho;
  el.querySelectorAll('[data-go]').forEach((c) =>
    c.addEventListener('click', (e) => {
      if (e.target.closest('[data-rm]')) return;
      focusNode(c.dataset.go);
    }),
  );
  el.querySelectorAll('[data-rm]').forEach((b) =>
    b.addEventListener('click', () => {
      removeEdge(n.id, b.dataset.rm);
      renderInspector();
    }),
  );
  const sm = $('#noModelo');
  if (sm)
    sm.onchange = () => {
      if (sm.value) ESCOLHA.no[n.id] = sm.value;
      else delete ESCOLHA.no[n.id];
      salvarEscolha();
      aoMudarModelos();
    };
  $('#btnSave').onclick = () => {
    if (travado()) return;
    const txt = $('#editor').value;
    S.files[n.arquivo] = txt;
    S.sujo = true;
    const fm = parseFM(txt);
    if (fm) {
      if (fm.nome) n.nome = String(fm.nome);
      if (Array.isArray(fm.usa) && n.tipo !== 'skill') n.usa = listaDe(fm.usa);
    }
    renderGraph();
    renderSide();
    renderInspector();
    toast('Arquivo salvo no ecossistema aberto. Exporte o .zip para guardar.', 'ok');
  };
  const rh = $('#btnRunHere');
  if (rh)
    rh.onclick = () => {
      if (travado()) return;
      S.entrada = n.id;
      rtab('prompt');
      statusLine(`O próximo envio começa em <b>${esc(n.nome)}</b>.`);
      $('#prompt').focus();
    };
  $('#btnDel').onclick = (e) => {
    if (travado()) return;
    if (!confirmDel) {
      confirmDel = true;
      e.target.textContent = 'Confirmar exclusão';
      return;
    }
    deleteNode(n.id);
  };
}

/* adicionar recurso */
$('#btnAdd').onclick = () => {
  const m = $('#modal');
  m.hidden = false;
  const parents = () => {
    const t = $('#mTipo').value;
    return S.nodes.filter((n) => CAN_USE[n.tipo].includes(t));
  };
  m.innerHTML = `<form class="box" id="addForm"><h3>Adicionar recurso</h3>
   <label class="fld">Tipo<select id="mTipo">${TYPE_ORDER.filter(
     (t) => t !== 'dominio' || !S.nodes.some((n) => n.tipo === 'dominio'),
   )
     .map((t) => `<option value="${t}">${TYPES[t].label}</option>`)
     .join('')}</select></label>
   <label class="fld">Nome<input type="text" id="mNome" placeholder="Ex.: Analista de Contratos" required></label>
   <label class="fld">Id<input type="text" id="mId" class="mono" required></label>
   <label class="fld">Quem vai chamar este recurso<select id="mPai"></select></label>
   <p class="hint-txt">O arquivo nasce do modelo do tipo, com os campos {{…}} para preencher. A validação mostra o que falta.</p>
   <div class="row-btns" style="justify-content:flex-end"><button type="button" class="btn" id="mCancel">Cancelar</button><button class="btn primary">Criar recurso</button></div></form>`;
  const sync = () => {
    const t = $('#mTipo').value;
    $('#mId').value = TYPES[t].p + '.' + (slugify($('#mNome').value) || 'novo');
    $('#mPai').innerHTML =
      '<option value="">Ninguém por enquanto</option>' +
      parents()
        .map((p) => `<option value="${esc(p.id)}">${esc(p.id)} — ${esc(p.nome)}</option>`)
        .join('');
  };
  $('#mTipo').onchange = sync;
  $('#mNome').oninput = () => {
    const t = $('#mTipo').value;
    $('#mId').value = TYPES[t].p + '.' + (slugify($('#mNome').value) || 'novo');
  };
  sync();
  $('#mNome').focus();
  $('#mCancel').onclick = () => (m.hidden = true);
  $('#addForm').onsubmit = (e) => {
    e.preventDefault();
    const t = $('#mTipo').value,
      id = $('#mId').value.trim(),
      nome = $('#mNome').value.trim();
    if (!/^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/.test(id) || id.split('.')[0] !== TYPES[t].p)
      return toast(
        `O id precisa começar com "${TYPES[t].p}." e usar letras minúsculas, números e hífens.`,
        'crit',
      );
    if (byId(id)) return toast('Já existe um recurso com esse id.', 'crit');
    if (t === 'dominio' && !byId(S.meta.raiz)) S.meta.raiz = id;
    createNode(t, nome, id, $('#mPai').value || null);
    m.hidden = true;
    renderAll();
    select(id);
    centerOn(id);
    rtab('insp');
    toast(`${id} criado. Preencha o arquivo no inspetor.`, 'ok');
  };
};
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') e.target.hidden = true;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('#modal').hidden = true;
    $('#fileMenu').hidden = true;
    if (S.link) toggleLink(false);
  }
});

/* ferramentas do canvas */
function toggleLink(on) {
  S.link = on;
  S.linkFrom = null;
  $('#btnLink').setAttribute('aria-pressed', String(on));
  $('#linkHint').hidden = !on;
  $('#linkHint').textContent = 'Clique no recurso de origem.';
}
$('#btnLink').onclick = () => toggleLink(!S.link);
$('#btnLayout').onclick = () => animateLayout(rootId());
$('#btnCollapseAll').onclick = () => collapseAll();
$('#btnExpandLevel').onclick = () => expandLevel();
$('#btnExpandAll').onclick = () => expandAll();
$('#btnFit').onclick = fit;
$('#zoomIn').onclick = () => zoomBy(1.2);
$('#zoomOut').onclick = () => zoomBy(1 / 1.2);
addEventListener('resize', () => {
  clearTimeout(window.__rt);
  window.__rt = setTimeout(fit, 150);
});
