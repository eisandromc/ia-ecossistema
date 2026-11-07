'use strict';

/* ---------- modelo de tipos ---------- */
const TYPES = {
  dominio: {
    ava: '👑',
    papel: 'A porta de entrada. Entende o pedido e escolhe quem cuida dele.',
    p: 'dom',
    label: 'Domínio',
    plural: 'Domínios',
    abbr: 'DOM',
    dir: '00-dominio',
    tpl: '_templates/dominio.md',
  },
  orquestrador: {
    ava: '🎼',
    papel: 'O gerente. Quebra o pedido em tarefas e distribui para a equipe.',
    p: 'orq',
    label: 'Orquestrador',
    plural: 'Orquestradores',
    abbr: 'ORQ',
    dir: '10-orquestradores',
    tpl: '_templates/orquestrador.md',
  },
  multiagentes: {
    ava: '🤝',
    papel: 'A mesa-redonda. Agentes debatem em rodadas até chegar a um consenso.',
    p: 'ma',
    label: 'Multiagentes',
    plural: 'Multiagentes',
    abbr: 'MA',
    dir: '20-multiagentes',
    tpl: '_templates/multiagentes.md',
  },
  workflow: {
    ava: '🛤️',
    papel: 'O roteiro fixo. Segue os passos em ordem, com portões de aprovação.',
    p: 'wf',
    label: 'Workflow',
    plural: 'Workflows',
    abbr: 'WF',
    dir: '50-workflows',
    tpl: '_templates/workflow.md',
  },
  agente: {
    ava: '🤖',
    papel: 'O especialista. Faz uma entrega completa da sua área.',
    p: 'ag',
    label: 'Agente',
    plural: 'Agentes',
    abbr: 'AG',
    dir: '30-agentes',
    tpl: '_templates/agente.md',
  },
  subagente: {
    ava: '🐝',
    papel: 'O ajudante. Resolve uma micro-tarefa com resposta em formato rígido.',
    p: 'sa',
    label: 'Subagente',
    plural: 'Subagentes',
    abbr: 'SA',
    dir: '40-subagentes',
    tpl: '_templates/subagente.md',
  },
  skill: {
    ava: '📜',
    papel: 'A receita. Um procedimento pronto que o agente segue.',
    p: 'sk',
    label: 'Skill',
    plural: 'Skills',
    abbr: 'SK',
    dir: '60-skills',
    tpl: '_templates/skill/SKILL.md',
  },
  rag: {
    ava: '📚',
    papel: 'A biblioteca. Documentos que o agente consulta para citar fontes.', p: 'rag', label: 'RAG', plural: 'Bases RAG', abbr: 'RAG', dir: '70-rag', tpl: '_templates/rag.md' },
};
const TYPE_ORDER = [
  'dominio',
  'orquestrador',
  'multiagentes',
  'workflow',
  'agente',
  'subagente',
  'skill',
  'rag',
];
const PREFIX = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v.p, k]));
const CAN_USE = {
  dominio: ['dominio', 'orquestrador'],
  orquestrador: ['agente', 'multiagentes', 'workflow'],
  multiagentes: ['agente'],
  workflow: ['agente', 'multiagentes', 'subagente', 'skill'],
  agente: ['subagente', 'skill', 'rag'],
  subagente: [],
  skill: [],
  rag: [],
};
// Cada item é uma exigência; os demais nomes são equivalentes usados por outros pacotes.
const SECTIONS = {
  dominio: [['Mapa de roteamento', 'Fluxo operacional'], ['Fronteira', 'Escopo']],
  orquestrador: [['Equipe disponível', 'Vinculação'], ['Checklist', 'Critérios de aceite']],
  multiagentes: [['Critério de consenso', 'Critério de convergência']],
  agente: [['Recursos permitidos', 'Dependências autorizáveis'], ['Formato de saída', 'Contrato de saída'], ['Limites', 'Autonomia e permissões']],
  subagente: [['Saída:', 'Schema de retorno'], ['Exemplo', 'Casos de teste']],
  workflow: [['Portão', 'Gate obrigatório'], ['Saída final', '## Saída']],
  skill: [['Procedimento'], ['Checklist', 'Testes']],
  rag: [['Regras de recuperação', 'Recuperação e ranking']],
};
const ROW = {
  dominio: 0,
  orquestrador: 1,
  workflow: 2,
  multiagentes: 2,
  agente: 3,
  subagente: 4,
  skill: 5,
  rag: 5,
};
const TRANS = new Set(['skill', 'rag']);
const tcolor = (t) => `var(--t-${TYPES[t] ? TYPES[t].p : 'sa'})`;
const KIT_RE = /^(_protocolo\/|_templates\/|80-adaptadores\/|tools\/|FABRICA\.md$|INSTALL\.md$)/;

/* ---------- estado ---------- */
const S = {
  meta: {},
  files: {},
  nodes: [],
  pos: {},
  sel: null,
  view: { x: 0, y: 0, k: 1 },
  nstate: {},
  run: null,
  link: false,
  expanded: new Set(),
  extra: new Set(),
  visible: new Set(),
  bubbles: {},
  flow: new Set(),
  speed: 1,
  linkFrom: null,
  kit: {},
  mode: 'exec',
  entrada: null,
  foco: null, // elementos usados pela demanda; null mostra a hierarquia inteira
  verConsultas: false,
  busca: '',
  sujo: false,
  anterior: null,
};
const byId = (id) => S.nodes.find((n) => n.id === id);
const usersOf = (id) => S.nodes.filter((n) => n.usa.includes(id));
const casaBusca = (n, q) => n.id.includes(q) || n.nome.toLowerCase().includes(q);
const emExecucao = () => !!S.run && (S.run.status === 'running' || S.run.status === 'waiting');
// Alterar o grafo no meio de uma execução deixaria o motor com recursos que não existem mais.
function travado() {
  if (!emExecucao()) return false;
  toast('Aguarde a execução terminar, ou clique em Parar, antes de alterar o ecossistema.', 'warn');
  return true;
}

/* ---------- frontmatter ---------- */
const nomeDeSkill = (s) => String(s || '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
const FM_RE = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
function parseFM(t) {
  const m = FM_RE.exec(t || '');
  if (!m) return null;
  try {
    const d = jsyaml.load(m[1]) || {};
    if (d.metadata && !d.id)
      return { ...d.metadata, nome: nomeDeSkill(d.name), _name: d.name, _description: d.description, usa: [] };
    return d;
  } catch {
    return null;
  }
}
const bodyOf = (t) => String(t || '').replace(FM_RE, '');
// Fontes de uma base RAG: as do cabeçalho e os arquivos do pacote que o corpo cita entre crases.
function fontesDoRag(n) {
  const t = S.files[n.arquivo] || '';
  const citadas = (bodyOf(t).match(/`[^`\s]+\.[a-z]+`/gi) || []).map((c) => c.slice(1, -1)).filter((p) => S.files[p] != null);
  return [...new Set([...listaDe((parseFM(t) || {}).fontes), ...citadas])];
}
const tituloDe = (text) => /^#\s+(.+)$/m.exec(bodyOf(text || ''))?.[1].trim();
function sectionOf(text, re) {
  const lines = bodyOf(text).split('\n');
  let start = -1,
    lvl = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.*)$/.exec(lines[i]);
    if (m && start < 0 && re.test(m[2])) {
      start = i + 1;
      lvl = m[1].length;
      continue;
    }
    if (m && start >= 0 && m[1].length <= lvl) return lines.slice(start, i).join('\n').trim();
  }
  return start >= 0 ? lines.slice(start).join('\n').trim() : '';
}
function tableRows(sec) {
  return sec
    .split('\n')
    .filter((l) => /^\s*\|/.test(l) && !/^\s*\|?\s*:?-{3,}/.test(l))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim().replace(/`/g, '')),
    )
    .slice(1);
}
const yq = (s) =>
  /^[A-Za-zÀ-ÿ0-9][\wÀ-ÿ .,()\/-]*$/.test(String(s)) ? String(s) : JSON.stringify(String(s));
function headerFor(n, extra = {}) {
  if (n.tipo === 'skill')
    return `---\nname: ${skillName(n.id)}\ndescription: ${JSON.stringify(extra.description || 'Use quando precisar de ' + n.nome.toLowerCase() + '.')}\nmetadata:\n  id: ${n.id}\n  tipo: skill\n  versao: "1.0.0"\n---\n`;
  const pai =
    extra.pai !== undefined
      ? extra.pai
      : (usersOf(n.id).find((u) => !['workflow', 'multiagentes'].includes(u.tipo)) || {}).id;
  let h = `---\nid: ${n.id}\ntipo: ${n.tipo}\nnome: ${yq(n.nome)}\nversao: 1.0.0\npai: ${TRANS.has(n.tipo) || n.tipo === 'subagente' || n.tipo === 'dominio' ? 'null' : pai || 'null'}\nusa: [${n.usa.join(', ')}]\n`;
  if (n.tipo === 'rag') h += `fontes: [${(extra.fontes || []).join(', ')}]\n`;
  return h + 'plataformas: [claude, chatgpt, copilot]\n---\n';
}
const skillName = (id) =>
  id
    .split('.')
    .slice(1)
    .join('-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/claude|anthropic/g, 'x') || 'skill';
function pathFor(n) {
  return n.tipo === 'skill' ? `60-skills/${n.id}/SKILL.md` : `${TYPES[n.tipo].dir}/${n.id}.md`;
}
function syncUsa(n) {
  const t = S.files[n.arquivo];
  if (t == null || n.tipo === 'skill') return;
  const m = FM_RE.exec(t);
  if (!m) return;
  const line = `usa: [${n.usa.join(', ')}]`;
  const fm = /^usa:.*$/m.test(m[1]) ? m[1].replace(/^usa:.*$/m, line) : m[1] + '\n' + line;
  S.files[n.arquivo] = m[0].replace(m[1], () => fm) + t.slice(m[0].length);
}

/* ---------- pacote ---------- */
function normalizeFiles(raw) {
  const paths = Object.keys(raw).filter((p) => !/(^|\/)(__MACOSX|\.DS_Store)/.test(p));
  const y = paths.filter((p) => /(^|\/)ecosystem\.ya?ml$/.test(p)).sort((a, b) => a.length - b.length)[0];
  const root = y ? y.replace(/ecosystem\.ya?ml$/, '') : '';
  const out = {};
  for (const p of paths) {
    if (root && !p.startsWith(root)) continue;
    out[p.slice(root.length)] = raw[p];
  }
  if (out['ecosystem.yml'] && !out['ecosystem.yaml']) {
    out['ecosystem.yaml'] = out['ecosystem.yml'];
    delete out['ecosystem.yml'];
  }
  return recolocarSoltos(out);
}
// Importar ecosystem.yaml + .md chega sem as pastas: devolve cada arquivo ao caminho do manifesto.
function recolocarSoltos(out) {
  let man;
  try {
    man = jsyaml.load(out['ecosystem.yaml'] || '');
  } catch {
    return out;
  }
  const mover = (alvo) => {
    const nome = String(alvo || '').split('/').pop();
    if (alvo && out[alvo] == null && out[nome] != null) {
      out[alvo] = out[nome];
      delete out[nome];
    }
  };
  for (const r of Array.isArray(man?.recursos) ? man.recursos : []) {
    mover(r?.arquivo);
    listaDe(parseFM(out[r?.arquivo] || '')?.fontes).forEach(mover);
  }
  return out;
}
function splitSingle(t) {
  const out = {};
  const re = /^=====\s*ARQUIVO:\s*(.+?)\s*=====\s*$/gm;
  let m,
    last = null,
    idx = 0;
  while ((m = re.exec(t))) {
    if (last) out[last] = t.slice(idx, m.index).trim() + '\n';
    last = m[1];
    idx = re.lastIndex;
  }
  if (last) out[last] = t.slice(idx).trim() + '\n';
  return out;
}
function loadPackage(files) {
  if (emExecucao()) {
    toast('Pare a execução em andamento antes de trocar de ecossistema.', 'warn');
    return false;
  }
  let man = null;
  if (files['ecosystem.yaml']) {
    try {
      man = jsyaml.load(files['ecosystem.yaml']) || {};
    } catch (e) {
      toast('O ecosystem.yaml tem erro de sintaxe: ' + e.message.split('\n')[0], 'crit');
      return false;
    }
  }
  const nodes = [];
  if (man && Array.isArray(man.recursos)) {
    for (const r of man.recursos) {
      if (!r || !r.id) continue;
      const id = String(r.id);
      const tipo = PREFIX[id.split('.')[0]] || 'subagente';
      const fm = parseFM(files[r.arquivo] || '');
      nodes.push({
        id,
        tipo,
        arquivo: String(r.arquivo || ''),
        usa: listaDe(r.usa),
        nome: String((fm && fm.nome) || tituloDe(files[r.arquivo]) || id),
      });
    }
  } else {
    for (const [p, t] of Object.entries(files)) {
      if (!/\.md$/.test(p) || p.startsWith('_templates/')) continue;
      const fm = parseFM(t);
      if (fm && fm.id && PREFIX[String(fm.id).split('.')[0]])
        nodes.push({
          id: String(fm.id),
          tipo: PREFIX[String(fm.id).split('.')[0]],
          arquivo: p,
          usa: listaDe(fm.usa),
          nome: String(fm.nome || fm.id),
        });
    }
    if (!nodes.length) {
      toast(
        'Nenhum ecossistema encontrado. O pacote precisa do ecosystem.yaml ou de arquivos .md com cabeçalho (id, tipo, usa).',
        'crit',
      );
      return false;
    }
    man = {
      nome: 'Ecossistema importado',
      versao: '1.0.0',
      ...man,
      raiz: (nodes.find((n) => n.tipo === 'dominio') || nodes[0]).id,
    };
  }
  S.meta = { ...man };
  delete S.meta.recursos;
  S.files = { ...files };
  S.nodes = nodes;
  S.expanded = new Set();
  S.extra = new Set();
  S.foco = null;
  S.bubbles = {};
  S.flow = new Set();
  S.pos = {};
  S.sel = null;
  S.nstate = {};
  S.run = null;
  S.sujo = false;
  S.anterior = null;
  $('#gate').hidden = true;
  statusLine('');
  Lud.narrarBoasVindas();
  layout();
  renderAll();
  requestAnimationFrame(fit);
  return true;
}
function manifestYaml() {
  const m = { ...S.meta };
  m.recursos = S.nodes.map((n) => ({ id: n.id, arquivo: n.arquivo, usa: [...n.usa] }));
  return (
    '# Manifesto do ecossistema — gerado pelo Console da Fábrica de IA\n' +
    jsyaml.dump(m, { lineWidth: 140, flowLevel: 3, noRefs: true })
  );
}
function exportFiles() {
  const f = { ...S.files };
  f['ecosystem.yaml'] = manifestYaml();
  return f;
}
