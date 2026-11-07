'use strict';

/* ---------- edição ---------- */
function addEdge(a, b) {
  if (travado()) return;
  const A = byId(a),
    B = byId(b);
  if (!A || !B) return;
  if (a === b) return toast('Escolha um destino diferente da origem.', 'warn');
  if (A.usa.includes(b)) return toast(`${a} já usa ${b}.`, 'warn');
  if (!CAN_USE[A.tipo].includes(B.tipo))
    return toast(
      `${TYPES[A.tipo].label} não pode chamar ${TYPES[B.tipo].label}. ${TYPES[A.tipo].label} só chama: ${CAN_USE[A.tipo].map((t) => TYPES[t].plural.toLowerCase()).join(', ') || 'ninguém'}.`,
      'crit',
    );
  A.usa.push(b);
  syncUsa(A);
  S.sujo = true;
  // Ligações só aparecem em recursos expandidos; sem isto a nova ficaria invisível.
  S.expanded.add(a);
  renderSide();
  refreshTree(a);
  toast(`Ligação criada: ${a} → ${b}`, 'ok');
}
function removeEdge(a, b) {
  const A = byId(a);
  if (!A || travado()) return;
  A.usa = A.usa.filter((x) => x !== b);
  syncUsa(A);
  S.sujo = true;
  renderGraph();
  renderSide();
}
// Apaga o arquivo do recurso e o que só ele usava: pasta da skill e fontes do RAG.
function removerArquivos(n) {
  const dir = n.tipo === 'skill' ? n.arquivo.replace(/SKILL\.md$/, '') : null;
  const fontes = n.tipo === 'rag' ? listaDe(parseFM(S.files[n.arquivo])?.fontes) : [];
  for (const p of Object.keys(S.files)) if (p === n.arquivo || (dir && p.startsWith(dir))) delete S.files[p];
  const emUso = S.nodes.filter((m) => m.tipo === 'rag').flatMap((m) => listaDe(parseFM(S.files[m.arquivo])?.fontes));
  for (const f of fontes) if (!emUso.includes(f)) delete S.files[f];
}
function deleteNode(id) {
  const n = byId(id);
  if (!n || travado()) return;
  S.nodes = S.nodes.filter((x) => x !== n);
  removerArquivos(n);
  S.sujo = true;
  S.expanded.delete(id);
  S.extra.delete(id);
  delete S.nstate[id];
  for (const m of S.nodes)
    if (m.usa.includes(id)) {
      m.usa = m.usa.filter((x) => x !== id);
      syncUsa(m);
    }
  delete S.pos[id];
  S.sel = null;
  renderAll();
  toast(`${id} excluído.`, 'ok');
}
function templateBody(tipo, fill) {
  let b = bodyOf(
    S.kit[TYPES[tipo].tpl] || S.files[TYPES[tipo].tpl] || `# [${TYPES[tipo].label.toUpperCase()}] {{Nome}}\n`,
  );
  if (fill) b = b.replace(/\{\{([^}]*)\}\}/g, (m, x) => fill(x));
  return b;
}
function createNode(tipo, nome, id, parent) {
  const n = { id, tipo, nome, arquivo: '', usa: [] };
  n.arquivo = pathFor(n);
  S.nodes.push(n);
  let body = templateBody(tipo).replace(/^# \[([^\]]+)\] .*$/m, `# [$1] ${nome}`);
  let extra = {};
  if (tipo === 'rag') {
    const f = `70-rag/fontes/${slugify(nome) || 'fonte'}.md`;
    extra.fontes = [f];
    S.files[f] =
      `# ${nome} (EXEMPLO — substitua pelo documento real)\n\n**Resumo:** \n**Palavras-chave:** \n\n## Seção 1\n`;
  }
  if (parent) {
    const P = byId(parent);
    if (P && CAN_USE[P.tipo].includes(tipo)) {
      P.usa.push(id);
      syncUsa(P);
    }
  }
  S.files[n.arquivo] = headerFor(n, extra) + body;
  S.sujo = true;
  // Abre o caminho inteiro até o recurso novo: o pai pode estar recolhido.
  const caminho = parent ? pathTo(id) : null;
  if (caminho) caminho.forEach((x) => S.expanded.add(x));
  else if (id !== S.meta.raiz) S.extra.add(id);
  layout();
  return n;
}

/* ---------- validação ---------- */
function validate() {
  const iss = [],
    E = (id, m) => iss.push({ sev: 'e', id, m }),
    W = (id, m) => iss.push({ sev: 'w', id, m });
  const seen = new Set();
  for (const n of S.nodes) {
    if (seen.has(n.id)) E(n.id, 'id duplicado');
    seen.add(n.id);
    if (!/^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$/.test(n.id)) E(n.id, 'id fora do padrão prefixo.nome-em-kebab');
    if (!PREFIX[n.id.split('.')[0]]) E(n.id, 'prefixo desconhecido');
  }
  const root = byId(S.meta.raiz);
  if (!root || root.tipo !== 'dominio')
    E(S.meta.raiz || 'raiz', 'a raiz do manifesto não existe ou não é um domínio');
  for (const n of S.nodes) {
    const t = S.files[n.arquivo];
    if (t == null) {
      E(n.id, 'arquivo não encontrado: ' + n.arquivo);
      continue;
    }
    for (const u of n.usa) {
      const m = byId(u);
      if (!m) E(n.id, `usa "${u}", que não existe`);
      else if (!CAN_USE[n.tipo].includes(m.tipo))
        W(n.id, `${TYPES[n.tipo].label} chamando ${TYPES[m.tipo].label}: fora da matriz de chamadas (${u})`);
    }
    // Pacotes têm vocabulário próprio: seção com outro nome é compatibilidade, não falha.
    for (const nomes of SECTIONS[n.tipo] || []) if (!nomes.some((s) => t.includes(s))) W(n.id, `sem a seção "${nomes[0]}"`);
    if (n.tipo === 'multiagentes' && !/Rodadas m[aá]ximas/i.test(t)) W(n.id, 'sem "Rodadas máximas": o painel usa 2 rodadas');
    if (t.includes('{{')) E(n.id, 'há campos {{…}} por preencher');
    if (t.length > 7500) W(n.id, `${fmtN(t.length)} caracteres (acima de 7.500)`);
    if (n.tipo === 'rag') {
      const f = fontesDoRag(n);
      if (!f.length) (t.includes('Corpus autorizado') ? W : E)(n.id, 'base RAG sem fontes');
      f.forEach((x) => {
        if (S.files[x] == null) E(n.id, 'fonte não encontrada: ' + x);
      });
    }
    if (n.tipo === 'skill') {
      const fm = parseFM(t) || {};
      if (!fm._description && !t.includes('## Propósito')) W(n.id, 'skill sem description');
    }
    if (n.tipo === 'workflow')
      for (const st of parseSteps(t))
        if (!byId(st.executor)) W(n.id, `o passo ${st.n} aponta para "${clip(st.executor, 40)}", que não existe`);
  }
  if (root) {
    const vis = new Set(),
      st = [root.id];
    while (st.length) {
      const c = st.pop();
      if (vis.has(c)) continue;
      vis.add(c);
      (byId(c) || { usa: [] }).usa.forEach((u) => st.push(u));
    }
    S.nodes.forEach((n) => {
      if (!vis.has(n.id)) E(n.id, 'não é alcançável a partir da raiz');
    });
  }
  return iss;
}
