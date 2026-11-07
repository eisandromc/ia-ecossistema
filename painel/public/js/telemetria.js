'use strict';

/* ---------- telemetria ---------- */
function now() {
  const r = S.run;
  if (!r) return 0;
  return r.t1 ?? performance.now() - r.t0;
}
function ev(type, from, to, text) {
  const r = S.run;
  if (!r) return;
  const e = { t: now(), type, from, to, text };
  r.events.push(e);
  if (ttab === 'ev') appendEv(e);
  $('#nEv').textContent = r.events.length;
  Lud.aoEvento(e);
}
const EVK = {
  handoff: 'HANDOFF',
  retorno: 'RETORNO',
  consulta: 'CONSULTA',
  portao: 'PORTÃO',
  erro: 'ERRO',
  info: 'INFO',
  llm: 'LLM',
};
function evHtml(e) {
  const arrow =
    e.from || e.to
      ? `<code>${esc(e.from || 'usuário')}</code>${e.to ? ` → <code>${esc(e.to)}</code>` : ''} `
      : '';
  return `<div class="ev"><span class="t">${fmtClock(e.t)}</span><span class="k ${e.type}">${EVK[e.type] || e.type}</span><span class="x">${arrow}${esc(e.text || '')}</span></div>`;
}
function appendEv(e) {
  const b = $('#tBody');
  if (b.querySelector('.empty')) b.innerHTML = '';
  b.insertAdjacentHTML('beforeend', evHtml(e));
  if (b.scrollHeight - b.scrollTop - b.clientHeight < 120) b.scrollTop = b.scrollHeight;
}
let ttab = 'tl';
const KL = {
  route: 'roteamento',
  plan: 'plano',
  agent: 'execução',
  ['agent-final']: 'entrega',
  sub: 'micro-tarefa',
  member: 'contribuição',
  moderator: 'moderação',
  integrate: 'integração',
  ['factory-structure']: 'estrutura',
  ['factory-content']: 'arquivo',
};
$$('[data-ttab]').forEach((b) =>
  b.addEventListener('click', () => {
    ttab = b.dataset.ttab;
    $$('[data-ttab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderTBody();
  }),
);
function renderTBody() {
  const b = $('#tBody');
  const r = S.run;
  $('#nEv').textContent = r ? r.events.length : '';
  $('#nCh').textContent = r && r.calls.length ? r.calls.length : '';
  $('#nQb').textContent = r && r.tasks.length ? r.tasks.length : '';
  if (!r) {
    b.innerHTML =
      '<p class="empty">Execute um prompt para ver chamadas, latência, tokens e o caminho percorrido pelo ecossistema.</p>';
    return;
  }
  if (ttab === 'ev') {
    b.innerHTML = r.events.map(evHtml).join('') || '<p class="empty">Sem eventos.</p>';
    b.scrollTop = b.scrollHeight;
    return;
  }
  if (ttab === 'qb') {
    b.innerHTML = r.tasks.length
      ? `<table class="grid"><thead><tr><th>Tarefa</th><th>Responsável</th><th>Objetivo</th><th>Status</th></tr></thead><tbody>${r.tasks.map((t) => `<tr><td class="mono">${esc(t.tid)}</td><td class="mono">${esc(t.resp)}</td><td>${esc(clip(t.obj, 110))}</td><td><span class="chip ${t.status === 'concluído' ? 'ok' : t.status === 'em andamento' ? 'acc' : t.status === 'aguardando' || t.status === 'interrompida' ? 'warn' : t.status === 'erro' || t.status === 'bloqueado' ? 'crit' : ''}">${esc(t.status)}</span></td></tr>`).join('')}</tbody></table>`
      : '<p class="empty">Nenhuma tarefa delegada ainda.</p>';
    return;
  }
  if (ttab === 'pr') {
    const ids = [...new Set(r.calls.map((c) => c.node))];
    b.innerHTML = ids.length
      ? `<table class="grid"><thead><tr><th>Recurso</th><th>Modelo</th><th class="num">Chamadas</th><th class="num">Tokens entrada</th><th class="num">Tokens saída</th><th class="num">Latência média</th><th class="num">Tempo total</th></tr></thead><tbody>${ids
          .map((id) => {
            const cs = r.calls.filter((c) => c.node === id && c.end != null);
            const n = byId(id);
            const tot = cs.reduce((s, c) => s + c.end - c.start, 0);
            return `<tr><td><span class="bdg" style="--c:${n ? tcolor(n.tipo) : 'var(--ink-3)'}">${n ? TYPES[n.tipo].abbr : 'FAB'}</span> <span class="mono">${esc(id)}</span></td><td class="mono">${esc([...new Set(cs.map(rotuloAlvo))].join(', ') || '—')}</td><td class="num">${cs.length}</td><td class="num">${fmtN(cs.reduce((s, c) => s + c.tin, 0))}</td><td class="num">${fmtN(cs.reduce((s, c) => s + c.tout, 0))}</td><td class="num">${fmtMs(cs.length ? tot / cs.length : null)}</td><td class="num">${fmtMs(tot)}</td></tr>`;
          })
          .join('')}</tbody></table>`
      : '<p class="empty">Nenhuma chamada ainda.</p>';
    return;
  }
  if (ttab === 'ch') {
    b.innerHTML = r.calls.length
      ? `<table class="grid hov"><thead><tr><th>#</th><th>Recurso</th><th>Etapa</th><th>Modelo</th><th class="num">Latência</th><th class="num">Tokens</th><th>Status</th></tr></thead><tbody>${r.calls
          .map((c, i) => {
            const fim = c.end ?? now();
            return `<tr data-c="${i}"><td class="mono">${i + 1}</td><td class="mono">${avaDe(c.node)} ${esc(c.node)}</td><td>${esc(KL[c.kind] || c.kind)}</td><td class="mono">${esc(rotuloAlvo(c))}</td><td class="num">${fmtMs(fim - c.start)}</td><td class="num">${c.est ? '≈' : ''}${fmtN(c.tin + c.tout)}</td><td><span class="chip ${c.end == null ? 'acc' : c.ok ? 'ok' : 'crit'}">${c.end == null ? 'em andamento' : c.ok ? 'ok' : 'falhou'}</span></td></tr>`;
          })
          .join('')}</tbody></table>`
      : '<p class="empty">Nenhuma chamada ainda.</p>';
    return;
  }
  // linha do tempo
  const total = Math.max(1, now(), ...r.calls.map((c) => c.end ?? now()));
  const ids = [...new Set(r.calls.map((c) => c.node))];
  if (!ids.length) {
    b.innerHTML = '<p class="empty">Aguardando a primeira chamada…</p>';
    return;
  }
  const ticks = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => `<span style="left:${f * 100}%">${fmtMs(total * f)}</span>`)
    .join('');
  b.innerHTML = `<div class="tl"><div class="tl-axis"><span></span><div class="ticks">${ticks}</div></div>${ids
    .map((id) => {
      const n = byId(id);
      const c = n ? tcolor(n.tipo) : 'var(--ink-2)';
      return `<div class="tl-row"><div class="tl-lab"><span class="bdg" style="--c:${c}">${n ? TYPES[n.tipo].abbr : 'FAB'}</span><span title="${esc(id)}">${esc(id)}</span></div><div class="tl-track">${r.calls
        .filter((x) => x.node === id)
        .map((x) => {
          const e = x.end ?? now();
          return `<span class="tl-bar${x.end == null ? ' run' : x.ok === false ? ' err' : ''}" data-c="${r.calls.indexOf(x)}" style="--c:${c};left:${(x.start / total) * 100}%;width:${Math.max(0.4, ((e - x.start) / total) * 100)}%" title="${esc(`${KL[x.kind] || x.kind} · ${rotuloAlvo(x)} · ${fmtMs(e - x.start)} · ${x.est ? '≈' : ''}${fmtN(x.tin)} → ${fmtN(x.tout)} tokens${x.err ? ' · ' + x.err : ''}`)}"></span>`;
        })
        .join('')}</div></div>`;
    })
    .join('')}</div>`;
}
function renderTelemetry() {
  renderIndicadores();
  renderTBody();
}
let tick = null,
  soon = false;
function telSoon() {
  if (soon) return;
  soon = true;
  requestAnimationFrame(() => {
    soon = false;
    renderIndicadores();
    if (ttab !== 'ev') renderTBody();
  });
}
function startTicker() {
  stopTicker();
  tick = setInterval(() => {
    if (S.run && (S.run.status === 'running' || S.run.status === 'waiting')) telSoon();
  }, 400);
}
function stopTicker() {
  clearInterval(tick);
  tick = null;
}
function addTask(tid, resp, obj) {
  S.run.tasks.push({ tid, resp, obj, status: 'em andamento' });
  telSoon();
}
function setTask(tid, status) {
  const t = S.run.tasks.find((x) => x.tid === tid);
  if (t) {
    t.status = status;
    telSoon();
  }
}

/* ---------- abrir uma chamada: o que foi enviado e o que voltou ---------- */
function abrirChamada(i) {
  const c = S.run && S.run.calls[i];
  if (!c) return;
  const m = $('#modal');
  const fim = c.end ?? now();
  const abas = [
    ['resp', 'Resposta', c.resposta ?? (c.err ? `Erro: ${c.err}` : '(aguardando…)')],
    ['user', 'Mensagem enviada', c.user],
    ['sys', 'Instruções do sistema', c.system],
  ];
  m.innerHTML = `<div class="box wide"><div class="call-h"><span class="ava-g" style="--c:${byId(c.node) ? tcolor(byId(c.node).tipo) : 'var(--ink-2)'}">${avaDe(c.node)}</span><div style="min-width:0"><h3>${esc(nomeDe(c.node))}</h3><div class="id">${esc(c.node)} · ${esc(KL[c.kind] || c.kind)}</div></div></div>
    <div class="call-m"><span class="chip acc">${esc(rotuloAlvo(c))}</span><span class="chip">${fmtMs(fim - c.start)}</span><span class="chip">${c.est ? '≈' : ''}${fmtN(c.tin)} → ${fmtN(c.tout)} tokens</span>${c.provider === 'sim' ? '<span class="chip">Resposta simulada</span>' : ''}</div>
    <div class="tabs" role="tablist">${abas.map(([k, t], i) => `<button class="tab" role="tab" data-ca="${k}" aria-selected="${i === 0}">${t}</button>`).join('')}</div>
    ${abas.map(([k, , txt], i) => `<pre class="call-b" data-cp="${k}"${i ? ' hidden' : ''}>${esc(txt)}</pre>`).join('')}
    <div class="row-btns" style="justify-content:flex-end"><button class="btn" id="mFechar">Fechar</button></div></div>`;
  m.hidden = false;
  m.querySelectorAll('[data-ca]').forEach((b) =>
    b.addEventListener('click', () => {
      m.querySelectorAll('[data-ca]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
      m.querySelectorAll('[data-cp]').forEach((p) => (p.hidden = p.dataset.cp !== b.dataset.ca));
    }),
  );
  $('#mFechar').onclick = () => (m.hidden = true);
}
// pointerdown: durante a execução a tabela é redesenhada e o click poderia se perder.
$('#tBody').addEventListener('pointerdown', (e) => {
  const alvo = e.target.closest('[data-c]');
  if (alvo) abrirChamada(+alvo.dataset.c);
});
