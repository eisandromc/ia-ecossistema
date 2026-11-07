'use strict';

/* ---------- simulação ---------- */
const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const NAO_CONTA = new Set(['para', 'com', 'das', 'dos', 'uma', 'por', 'que', 'sobre']);
function score(text, words) {
  const t = norm(text);
  return words.reduce((s, w) => {
    w = norm(w).trim();
    return w.length > 2 && !NAO_CONTA.has(w) && t.includes(w) ? s + 1 : s;
  }, 0);
}
const LAT = {
  route: [450, 800],
  plan: [800, 1400],
  agent: [900, 1500],
  'agent-final': [1100, 2100],
  sub: [350, 700],
  member: [700, 1200],
  moderator: [900, 1500],
  integrate: [1100, 1900],
  'factory-structure': [1600, 2400],
  'factory-content': [700, 1300],
};
let simSeed = 7;
const rnd = () => {
  simSeed = (simSeed * 16807) % 2147483647;
  return simSeed / 2147483647;
};
async function simAnswer(node, kind, m) {
  const [a, b] = LAT[kind] || [500, 900];
  const lat = a + (b - a) * rnd();
  const r = S.run;
  await sleep(lat / S.speed, r.abort.signal);
  let o;
  if (kind === 'route') {
    const rows = tableRows(sectionOf(S.files[m.dom.arquivo], /Mapa de roteamento/i));
    let best = null,
      bs = 0;
    for (const row of rows) {
      const s = score(m.prompt, (row[0] + ' ' + (row[1] || '')).split(/[,;\/\s]+/));
      const id = (row[2] || '').trim();
      if (s > bs && byId(id)) {
        bs = s;
        best = id;
      }
    }
    // Nenhum sinal do pedido bate com o mapa: pergunta, como o domínio faria de verdade.
    const opcoes = rows.filter((row) => byId((row[2] || '').trim())).map((row) => row[0].toLowerCase());
    if (!bs && opcoes.length) {
      return {
        text: JSON.stringify({
          acao: 'responder',
          resposta: `Posso ajudar com ${opcoes.join(', ')}. Qual destas opções você precisa?`,
        }),
      };
    }
    // Sem mapa de roteamento, escolhe pelo orquestrador cujo arquivo mais combina com o pedido.
    const palavras = m.prompt.split(/[,;\/\s]+/);
    const nota = (o) => score(`${o.nome} ${S.files[o.arquivo] || ''}`, palavras);
    best = best || [...m.orqs].sort((a, b) => nota(b) - nota(a))[0]?.id;
    const turma = (/\b(\d[A-Z])\b/.exec(m.prompt) || [])[1];
    const dur = (/(\d+)\s*min/i.exec(m.prompt) || [])[1];
    const en = {};
    if (turma) en.turma = turma;
    if (dur) en.duracao_min = +dur;
    o = {
      acao: 'rotear',
      orquestrador: best,
      objetivo: m.prompt,
      entradas: en,
      justificativa: bs
        ? 'sinais do pedido batem com o Mapa de roteamento'
        : 'orquestrador padrão do domínio',
    };
  } else if (kind === 'plan') {
    const team = m.team;
    const eq = tableRows(sectionOf(S.files[m.orq.arquivo], /Equipe/i));
    const when = (id) =>
      `${(eq.find((r) => r[0] === id) || [])[2] || ''} ${byId(id)?.nome} ${sectionOf(S.files[byId(id)?.arquivo], /Miss[aã]o/i)}`;
    // Palavra inteira: "unidade" não pode casar com "oportunidades".
    const querFluxo = /\b(semana|unidade|sequencia|complet[oa]|fluxo|pacote)\b/.test(norm(m.task.pedido));
    const palavras = m.task.pedido.split(/[\s,;]+/);
    const wf = querFluxo
      ? team.filter((t) => t.tipo === 'workflow').sort((a, b) => score(when(b.id), palavras) - score(when(a.id), palavras))[0]
      : null;
    let plano = [];
    if (wf) plano = [{ para: wf.id, objetivo: m.task.objetivo }];
    else {
      const ags = team
        .filter((t) => t.tipo === 'agente')
        .map((t) => ({ t, s: score(m.task.pedido, when(t.id).split(/[\s,;]+/)) }))
        .sort((x, y) => y.s - x.s);
      const pick = ags.filter((x) => x.s > 0).slice(0, 2);
      (pick.length ? pick : ags.slice(0, 1)).forEach((x) =>
        plano.push({ para: x.t.id, objetivo: m.task.objetivo }),
      );
      const ma = team.find((t) => t.tipo === 'multiagentes');
      if (
        ma &&
        (plano.length > 1 || score(m.task.pedido, ['revis', 'revise', 'qualidade', 'prova', 'avalia']) > 0)
      )
        plano.push({ para: ma.id, objetivo: 'Revisão conjunta das entregas' });
    }
    o = {
      entendimento: 'Plano simulado a partir da equipe declarada e dos sinais do pedido.',
      plano,
      precisa_usuario: null,
    };
  } else if (kind === 'agent') {
    o = {
      chamar: [
        {
          para: m.subs[0],
          entrada: { texto: 'rascunho da entrega de ' + node, publico: 'definido no domínio' },
        },
      ],
    };
  } else if (kind === 'agent-final') {
    const fmt = sectionOf(S.files[m.agent.arquivo], /Formato de sa|Contrato de sa/i);
    const fontes = m.agent.usa.filter((u) => (byId(u) || {}).tipo === 'rag').map((u) => u + '#exemplo');
    o = {
      status: 'concluido',
      entrega: `### ${m.agent.nome}\n\n**Tarefa:** ${clip(m.task.objetivo, 180)}\n\nEstrutura da entrega, conforme o arquivo do agente:\n\n${fmt || '- Entrega no formato definido pelo agente.'}\n\n> Conteúdo simulado. Escolha um modelo na aba Conexão para gerar a entrega real.`,
      fontes,
      observacoes: '',
    };
  } else if (kind === 'sub') {
    o = { ok: true, resultado: 'saída simulada de ' + node };
  } else if (kind === 'member') {
    o = {
      contribuicao: `[${node}] ponto de vista da rodada ${m.round}: verificar alinhamento entre objetivos e entregas (simulado).`,
      ajustes: ['Explicitar o critério de pronto de cada entrega'],
    };
  } else if (kind === 'moderator') {
    const ok = m.round >= Math.min(2, m.rounds);
    const cr = m.crit.length ? m.crit : ['Qualidade', 'Clareza'];
    o = {
      notas: Object.fromEntries(cr.map((c, i) => [c, ok ? 8 + ((i + m.round) % 2) : 6 + (i % 2)])),
      aprovado: ok,
      decisao: ok ? 'Pacote aprovado.' : 'Ajustes necessários antes de aprovar.',
      pacote_revisado: m.pacote,
    };
  } else if (kind === 'integrate') {
    const items = (m.chk.match(/^- .+$/gm) || []).map((l) => l.replace(/^- (\[.\] )?/, '').replace(/;$/, ''));
    o = {
      titulo: `Entrega de ${m.orq.nome}`,
      resumo: `${m.rets.length} retorno(s) integrado(s) pelo ${m.orq.id} (simulação).`,
      entrega: m.rets.map((r) => r.entrega).join('\n\n---\n\n') || 'Sem retornos.',
      fontes: [],
      checklist: items.map((i) => ({ item: i, ok: true })),
      proximo_passo: 'Conecte um modelo para gerar o conteúdo real.',
    };
  } else if (kind === 'factory-structure') o = simStructure(m.prompt, m.evolve);
  else if (kind === 'factory-content') {
    const n = m.node;
    const filled = templateBody(n.tipo, (x) => `[preencher: ${x.split('—')[0].trim()}]`).replace(
      /^# \[([^\]]+)\] .*$/m,
      `# [$1] ${n.nome}`,
    );
    return {
      text:
        (n.tipo === 'skill'
          ? `DESCRIPTION: Use quando precisar de ${n.nome.toLowerCase()}.\n===ARQUIVO===\n`
          : '') +
        filled +
        (n.tipo === 'rag'
          ? `\n===FONTE===\n# ${n.nome} (EXEMPLO FICTÍCIO — substitua)\n\n## Seção 1\nConteúdo de exemplo.\n`
          : ''),
    };
  }
  return { text: JSON.stringify(o) };
}
function simStructure(prompt, evolve) {
  if (evolve) {
    const cur = S.nodes.map((n) => ({
      id: n.id,
      nome: n.nome,
      papel: '',
      usa: [...n.usa],
      mudanca: 'mantido',
    }));
    const host = S.nodes.find((n) => n.tipo === 'orquestrador');
    const tema = prompt
      .split(/\s+/)
      .find((w) => w.length > 4 && !/^(adicione|adiciona|inclua|crie|criar|agente|novo|nova|skill|workflow)$/i.test(w));
    const id = 'ag.' + (slugify(tema) || 'novo-agente');
    if (host && !byId(id)) {
      cur.push({
        id,
        nome: `Agente de ${tema || 'apoio'}`,
        papel: 'Novo agente pedido na evolução (simulação)',
        usa: [],
        mudanca: 'novo',
      });
      cur.find((c) => c.id === host.id).usa.push(id);
      cur.find((c) => c.id === host.id).mudanca = 'alterado';
    }
    return {
      nome: S.meta.nome,
      descricao: S.meta.descricao || '',
      raiz: S.meta.raiz,
      recursos: cur,
      remover: [],
    };
  }
  const words = prompt
    .replace(/[^\wÀ-ÿ\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^ecossistema$/i.test(w));
  const area = words.slice(0, 3).join(' ') || 'Operações';
  const s = slugify(words.slice(0, 2).join(' ')) || 'operacoes';
  const R = (id, nome, papel, usa) => ({ id, nome, papel, usa });
  return {
    nome: 'Ecossistema ' + area.charAt(0).toUpperCase() + area.slice(1),
    descricao: prompt,
    raiz: 'dom.' + s,
    recursos: [
      R('dom.' + s, 'Domínio ' + area, 'porta de entrada e regras da área', [
        'orq.operacoes',
        'orq.qualidade',
      ]),
      R('orq.operacoes', 'Orquestrador de Operações', 'coordena a produção das entregas recorrentes', [
        'ag.pesquisador',
        'ag.redator',
        'wf.fluxo-padrao',
      ]),
      R('orq.qualidade', 'Orquestrador de Qualidade', 'coordena auditoria e revisão', [
        'ag.auditor',
        'ma.comite-revisao',
      ]),
      R('ma.comite-revisao', 'Comitê de Revisão', 'revisão em rodadas com moderador', [
        'ag.redator',
        'ag.auditor',
      ]),
      R('wf.fluxo-padrao', 'Fluxo Padrão', 'pesquisa → redação → revisão com portões', [
        'ag.pesquisador',
        'ag.redator',
        'ma.comite-revisao',
      ]),
      R('ag.pesquisador', 'Pesquisador', 'levanta fatos na base de conhecimento', [
        'rag.base-conhecimento',
        'sk.pesquisa',
      ]),
      R('ag.redator', 'Redator', 'produz a entrega no padrão da área', ['sa.revisor', 'sk.padrao-documento']),
      R('ag.auditor', 'Auditor', 'confere conformidade e riscos', [
        'sk.checklist-qualidade',
        'rag.base-conhecimento',
      ]),
      R('sa.revisor', 'Revisor de Linguagem', 'ajusta linguagem ao público em JSON', []),
      R('sk.pesquisa', 'Pesquisa Estruturada', 'procedimento de pesquisa com citação', []),
      R('sk.padrao-documento', 'Padrão de Documento', 'template das entregas', []),
      R('sk.checklist-qualidade', 'Checklist de Qualidade', 'critérios de aprovação', []),
      R('rag.base-conhecimento', 'Base de Conhecimento', 'documentos de referência da área', []),
    ],
  };
}
