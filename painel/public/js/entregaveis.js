'use strict';

/* ---------- painel de entregáveis e indicadores da execução ---------- */
const META_QUALIDADE = 85;
const ENT = { abertos: new Set(), html: '' };

const chamadasDe = (r, ...tipos) => r.calls.filter((c) => tipos.includes(c.kind) && c.ok);
const emAndamento = (r, ...tipos) => r.calls.some((c) => tipos.includes(c.kind) && c.end == null);
const consultasRag = (r) => r.events.filter((e) => e.type === 'consulta' && byId(e.to)?.tipo === 'rag');
const interacoes = (r) => r.events.filter((e) => ['handoff', 'retorno', 'consulta'].includes(e.type)).length;

// Cada item vem do que a execução produziu. Sem dado, o selo fica em "—".
function itensEntregaveis(r) {
  const vazio = { selo: '—', ativo: false, linhas: [] };
  if (!r) return ENTREGAVEIS.map((e) => ({ ...e, ...vazio }));
  const versao = (n) => (n ? `v${n}` : '—');
  const planos = chamadasDe(r, 'plan');
  const agentes = entregasDosAgentes(r);
  const revisoes = chamadasDe(r, 'moderator');
  const rag = consultasRag(r);
  const portoes = r.events.filter((e) => e.type === 'portao');
  const q = r.qualidade;
  const dados = {
    requisitos: { selo: versao(r.turno), ativo: emAndamento(r, 'route'), linhas: [r.label] },
    plano: {
      selo: versao(planos.length),
      ativo: emAndamento(r, 'plan'),
      linhas: r.tasks.map((t) => `${t.resp}: ${clip(t.obj, 90)} (${t.status})`),
    },
    agentes: {
      selo: versao(agentes.length),
      ativo: emAndamento(r, 'agent', 'agent-final', 'sub'),
      linhas: agentes.map((a) => `${nomeDe(a.id)}: entrega pronta`),
    },
    revisao: {
      selo: versao(revisoes.length),
      ativo: emAndamento(r, 'member', 'moderator'),
      linhas: revisoes.map((c, i) => `${nomeDe(c.node)}: rodada ${i + 1} avaliada`),
    },
    auditoria: {
      selo: r.status === 'running' || r.status === 'waiting' ? 'ao vivo' : `${r.events.length} eventos`,
      ativo: false,
      linhas: r.events.slice(-6).map((e) => `${fmtClock(e.t)} ${clip(e.text || e.type, 90)}`),
    },
    qualidade: {
      selo: q ? `${q.pct}%` : '—',
      ativo: r.status === 'waiting',
      linhas: [...(q?.itens || []).map((c) => `${c.ok ? '✓' : '✗'} ${c.item}`), ...portoes.map((e) => `Portão: ${clip(e.text, 90)}`)],
    },
    rag: {
      selo: rag.length ? `${rag.length} ${rag.length === 1 ? 'consulta' : 'consultas'}` : '—',
      ativo: Object.entries(S.nstate).some(([id, st]) => st === 'consult' && byId(id)?.tipo === 'rag'),
      linhas: rag.map((e) => `${nomeDe(e.from)}: ${nomeDe(e.to)}`),
    },
    entrega: {
      selo: versao(r.resultado ? r.turno : 0),
      ativo: emAndamento(r, 'integrate'),
      linhas: r.resultado ? [r.resultado.titulo || 'Resultado', r.resultado.resumo].filter(Boolean) : [],
    },
  };
  return ENTREGAVEIS.map((e) => ({ ...e, ...dados[e.id] }));
}
const ENTREGAVEIS = [
  { id: 'requisitos', nome: 'Requisitos', cor: '--t-dom' },
  { id: 'plano', nome: 'Plano de trabalho', cor: '--t-ag' },
  { id: 'agentes', nome: 'Entregas dos agentes', cor: '--t-orq' },
  { id: 'revisao', nome: 'Revisão multiagentes', cor: '--t-ma' },
  { id: 'auditoria', nome: 'Relatório da Auditoria', cor: '--t-wf' },
  { id: 'qualidade', nome: 'Validação de qualidade', cor: '--t-rag' },
  { id: 'rag', nome: 'Base de conhecimento (RAG)', cor: '--t-sk' },
  { id: 'entrega', nome: 'Entrega final', cor: '--t-sa' },
];
function renderEntregaveis() {
  const el = $('#paneent');
  if (el.hidden) return;
  const itens = itensEntregaveis(S.run)
    .map((i) => {
      const aberto = ENT.abertos.has(i.id);
      const corpo = i.linhas.length
        ? `<ul>${i.linhas.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
        : '<p class="hint-txt">Ainda não produzido.</p>';
      return `<details class="ent" data-ent="${i.id}"${i.ativo ? ' data-ativo="1"' : ''}${aberto ? ' open' : ''}><summary><span class="ent-cor" style="background:var(${i.cor})"></span><b>${esc(i.nome)}</b>${i.ativo ? '<span class="ent-exec">executando</span>' : ''}<span class="ent-selo">${esc(i.selo)}</span><span class="seta" aria-hidden="true">▸</span></summary><div class="ent-corpo">${corpo}</div></details>`;
    })
    .join('');
  const html = `<div class="ent-topo"><h2>Painel de entregáveis</h2><span>Entregáveis por versão</span></div><div class="ent-lista">${itens}</div>`;
  // O relógio redesenha a telemetria várias vezes por segundo: sem mudança, nada de refazer o DOM.
  if (html === ENT.html && el.firstChild) return;
  ENT.html = html;
  el.innerHTML = html;
}
$('#paneent').addEventListener(
  'toggle',
  (e) => {
    const id = e.target.dataset?.ent;
    if (!id) return;
    if (e.target.open) ENT.abertos.add(id);
    else ENT.abertos.delete(id);
    ENT.html = '';
  },
  true,
);
// Nota do checklist que o orquestrador aplicou à entrega. Sem checklist, não há nota.
function registrarQualidade(r, itens) {
  if (!itens?.length) return;
  CHAT.rodadas++;
  r.qualidade = {
    pct: Math.round((itens.filter((c) => c.ok).length / itens.length) * 100),
    rodada: CHAT.rodadas,
    itens,
  };
}
const fmtCurto = (n) => {
  const dec = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  if (n >= 1e6) return `${dec(n / 1e6)} mi`;
  return n >= 1e3 ? `${dec(n / 1e3)} mil` : fmtN(n);
};
function renderIndicadores() {
  const r = S.run;
  const calls = r ? r.calls : [];
  const prontas = calls.filter((c) => c.end != null);
  const tin = prontas.reduce((s, c) => s + c.tin, 0);
  const tout = prontas.reduce((s, c) => s + c.tout, 0);
  const aprox = prontas.some((c) => c.est) ? '≈' : '';
  const contexto = prontas.reduce((m, c) => Math.max(m, c.tin), 0);
  const q = r?.qualidade;
  const tile = (v, l, extra = '') => `<div class="kpi"><div class="v">${v}</div><div class="l">${l}</div>${extra}</div>`;
  const barra = q
    ? `<div class="kpi-barra"><i class="${q.pct >= META_QUALIDADE ? 'ok' : 'abaixo'}" style="width:${q.pct}%"></i><b style="left:${META_QUALIDADE}%"></b></div>`
    : '';
  $('#kpis').innerHTML =
    tile(r ? interacoes(r) : 0, 'interações entre agentes') +
    tile(r ? chamadasDe(r, 'moderator').length : 0, 'revisões') +
    tile(r ? fmtMs(now()) : '—', `tempo decorrido${r ? ` · ${calls.length} de ${r.budget} chamadas` : ''}`) +
    tile(`${aprox}${fmtCurto(tin + tout)}`, `tokens · ${fmtCurto(tin)} entrada, ${fmtCurto(tout)} saída`) +
    tile(contexto ? `~${fmtCurto(contexto)}` : '—', 'contexto · janela não informada') +
    tile(q ? `${q.pct}%` : '—', `Controle de Qualidade${q ? ` rodada ${q.rodada}` : ''} · meta ${META_QUALIDADE}%`, barra);
  renderEntregaveis();
}

/* ---------- conferência da execução e arquivo final ---------- */
// O que de fato aconteceu: quem foi acionado, quem respondeu e por qual modelo.
function rastreioDe(r) {
  const respondeu = (id) => r.calls.filter((c) => c.node === id && c.ok);
  const agentes = [...r.acionados].map((id) => {
    const calls = respondeu(id);
    return { id, nome: nomeDe(id), chamadas: calls.length, modelos: [...new Set(calls.map((c) => c.alvo))] };
  });
  return {
    agentes,
    faltaram: agentes.filter((a) => !a.chamadas),
    reais: r.calls.filter((c) => c.ok && c.provider !== 'sim').length,
    simuladas: r.calls.filter((c) => c.ok && c.provider === 'sim').length,
    final: r.calls.some((c) => c.kind === 'integrate' && c.ok),
  };
}
function rastreioHtml(r) {
  const x = rastreioDe(r);
  const n = x.agentes.length;
  const origem = !x.simuladas ? `${x.reais} chamada(s) ao LLM` : x.reais ? `${x.reais} ao LLM e ${x.simuladas} em Simulação` : `${x.simuladas} em Simulação, sem LLM`;
  const faltas = x.faltaram.length ? `<div class="note warn">Sem resposta: ${esc(x.faltaram.map((a) => a.nome).join(', '))}.</div>` : '';
  const mistura = x.reais && x.simuladas ? '<div class="note warn">Parte desta execução rodou em Simulação: confira o modelo por nível na aba Conexão.</div>' : '';
  const lista = x.agentes.map((a) => `<li>${esc(a.nome)}: ${a.chamadas} chamada(s)${a.modelos.length ? `, ${esc(a.modelos.join(', ').replace(/^sim$/, 'Simulação'))}` : ''}</li>`).join('');
  return `${faltas}${mistura}<details class="rastro"><summary>Passou por ${n} agente${n === 1 ? '' : 's'} · ${origem}${x.final ? ' · prompt final executado' : ''}</summary><ul>${lista || '<li>Nenhum agente acionado.</li>'}</ul></details>`;
}
// Agente com subagentes entrega na chamada "agent" quando não delega; a que só delega não é entrega.
function entregasDosAgentes(r) {
  return r.calls
    .filter((c) => ['agent', 'agent-final'].includes(c.kind) && c.ok)
    .flatMap((c) => {
      try {
        const j = parseJSON(c.resposta);
        return j.chamar?.length ? [] : [{ id: c.node, entrega: normRet(j).entrega }];
      } catch {
        return [{ id: c.node, entrega: c.resposta }];
      }
    });
}
function arquivoDaEntrega(r, res) {
  const x = rastreioDe(r);
  const lista = (titulo, itens) => (itens?.length ? `\n## ${titulo}\n\n${itens.map((i) => `- ${i}`).join('\n')}\n` : '');
  const anexos = entregasDosAgentes(r).map((a) => `\n### ${nomeDe(a.id)}\n\n${a.entrega}\n`).join('');
  return [
    `# ${res.titulo || 'Entrega'}\n`,
    `**Pedido:** ${r.label}  \n**Ecossistema:** ${S.meta.nome}  \n**Data:** ${new Date().toLocaleString('pt-BR')}\n`,
    res.resumo ? `${res.resumo}\n` : '',
    res.aviso ? `> ${res.aviso}\n` : '',
    `${res.entrega}\n`,
    lista('Fontes', res.fontes),
    lista('Checklist', res.checklist?.map((c) => `${c.ok ? '[x]' : '[ ]'} ${c.item}`)),
    res.proximo ? `\n## Próximo passo\n\n${res.proximo}\n` : '',
    lista('Agentes acionados', x.agentes.map((a) => `${a.nome}: ${a.chamadas} chamada(s), ${a.modelos.join(', ') || 'sem resposta'}`)),
    anexos ? `\n## Entregas de cada agente\n${anexos}` : '',
  ].join('\n');
}
