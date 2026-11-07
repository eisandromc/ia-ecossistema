'use strict';

/* ---------- UI de prompt ---------- */
const FABRICA = {
  gen: {
    titulo: 'Gerar ecossistema',
    dica: 'Descreva a área, o público e as entregas recorrentes. A Fábrica desenha a estrutura no canvas e depois escreve o arquivo de cada recurso. Substitui o ecossistema aberto: exporte antes, se quiser guardar.',
    exemplo: 'Ex.: Ecossistema para o RH de uma rede de escolas: onboarding de professores, comunicados internos e indicadores de turnover',
    acao: 'Gerar',
  },
  evo: {
    titulo: 'Evoluir ecossistema',
    dica: 'Peça uma mudança no ecossistema aberto: novo agente, nova skill, um workflow, outra ligação. Os recursos novos e alterados aparecem destacados no canvas.',
    exemplo: 'Ex.: Adicione um agente de acessibilidade usado pelo orquestrador pedagógico',
    acao: 'Aplicar',
  },
};
function pedirFabrica(modo) {
  if (travado()) return;
  const f = FABRICA[modo];
  const m = $('#modal');
  m.hidden = false;
  m.innerHTML = `<form class="box" id="fabForm"><h3>${f.titulo}</h3>
   <label class="fld">Pedido<textarea id="fabPedido" rows="5" required placeholder="${esc(f.exemplo)}"></textarea></label>
   <p class="hint-txt">${f.dica}</p>
   <div class="row-btns" style="justify-content:flex-end"><button type="button" class="btn" id="fabCancel">Cancelar</button><button class="btn primary">${f.acao}</button></div></form>`;
  $('#fabPedido').focus();
  $('#fabCancel').onclick = () => (m.hidden = true);
  $('#fabForm').onsubmit = (e) => {
    e.preventDefault();
    m.hidden = true;
    rtab('prompt');
    run({ modo, prompt: $('#fabPedido').value });
  };
}
function uiRunning(on) {
  $('#btnRun').disabled = on;
  $('#btnStop').hidden = !on;
  $('#modoEscolha').disabled = on;
  $('#btnAdd').disabled = on;
}
function statusLine(html) {
  $('#statusLine').innerHTML = html;
}
let statusTimer = null;
// Roda em simulação, com a árvore recolhida, para ver o ecossistema se abrir conforme as chamadas avançam.
async function demonstrar() {
  if (emExecucao()) return toast('Aguarde a execução em andamento terminar.', 'warn');
  rtab('prompt', false);
  const d = byId(S.meta.raiz);
  const lista = d ? (sectionOf(S.files[d.arquivo], /Iniciadores/i).match(/^- .+$/gm) || []).map((l) => l.slice(2)) : [];
  const pedido = lista.find((l) => /semana|unidade/i.test(l)) || lista[0] || 'Mostre como o ecossistema funciona';
  $('#prompt').value = pedido.replace(/^["“]|["”]$/g, '');
  await collapseAll();
  run({ demo: true });
}
/* conversa: histórico em cima, prompt sempre embaixo */
const CHAT = { turnos: [], demo: false, rodadas: 0 };
const TURNOS_NO_CONTEXTO = 3;
function rolarChat() {
  const c = $('#chat');
  requestAnimationFrame(() => (c.scrollTop = c.scrollHeight));
}
function chatAdd(html) {
  $('#chatVazio').hidden = true;
  $('#chatHist').insertAdjacentHTML('beforeend', html);
  $('#btnNova').hidden = false;
  rolarChat();
  return $('#chatHist').lastElementChild;
}
function novaConversa() {
  CHAT.turnos = [];
  CHAT.demo = false;
  CHAT.rodadas = 0;
  S.entrada = null;
  $('#chatHist').innerHTML = '';
  $('#chatVazio').hidden = false;
  $('#btnNova').hidden = true;
  statusLine('');
}
// Como nas plataformas web, cada mensagem segue a conversa: o modelo recebe os últimos turnos.
function comContexto(texto) {
  const turnos = CHAT.turnos.slice(-TURNOS_NO_CONTEXTO);
  if (!turnos.length) return texto;
  const historico = turnos.map((t) => `Usuário: ${clip(t.pedido, 800)}\nSistema: ${clip(t.resposta, 2000)}`).join('\n\n');
  return `Histórico da conversa:\n${historico}\n\nMensagem atual do usuário: ${texto}`;
}
let entradaDoRun = null;
async function run(opts = {}) {
  const digitado = opts.prompt === undefined;
  const texto = (digitado ? $('#prompt').value : opts.prompt).trim();
  if (!texto) {
    $('#prompt').focus();
    return toast('Escreva o prompt antes de enviar.', 'warn');
  }
  S.mode = opts.modo || 'exec';
  entradaDoRun = S.entrada;
  S.entrada = null;
  if (S.mode === 'exec' && validate().some((i) => i.sev === 'e' && i.m.startsWith('a raiz')))
    return toast('O ecossistema não tem domínio raiz válido.', 'crit');
  const prompt = S.mode === 'exec' ? comContexto(texto) : texto;
  $('#gate').hidden = true;
  if (digitado) $('#prompt').value = '';
  chatAdd(`<div class="msg eu">${esc(texto)}</div>`);
  newRun(S.mode, texto, opts);
  S.run.turno = CHAT.turnos.length + 1;
  Lud.narrar('🙋', `Você fez um pedido: “${esc(clip(texto, 90))}”`);
  uiRunning(true);
  statusTimer = setInterval(() => {
    const r = S.run;
    if (r && r.status === 'running')
      statusLine(
        `<span class="spin"></span>${S.mode === 'exec' ? 'Executando' : 'Construindo'} · ${r.calls.length} chamada(s) · ${fmtMs(now())}`,
      );
    else if (r && r.status === 'waiting')
      statusLine('<span class="chip warn">Portão</span> aguardando sua aprovação');
  }, 300);
  try {
    if (S.mode === 'exec') {
      await focarNaDemanda();
      moverVista(viewToFit());
    }
    let res;
    const n = byId(entradaDoRun);
    if (S.mode === 'gen') res = await runFactory(prompt, false);
    else if (S.mode === 'evo') res = await runFactory(prompt, true);
    else if (!n || n.tipo === 'dominio') res = await runDomain(prompt);
    else if (n.tipo === 'orquestrador')
      res = await runOrchestrator(n.id, {
        tid: nextTid(),
        from: null,
        objetivo: prompt,
        entradas: {},
        pedido: prompt,
      });
    else if (n.tipo === 'workflow') {
      const r = await runWorkflow(n.id, {
        tid: nextTid(),
        from: null,
        objetivo: prompt,
        entradas: {},
        pedido: prompt,
      });
      res = { titulo: n.nome, entrega: r.entrega, fontes: r.fontes };
    } else if (n.tipo === 'agente') {
      const r = await runAgent(n.id, {
        tid: nextTid(),
        from: null,
        objetivo: prompt,
        entradas: {},
        pedido: prompt,
      });
      res = { titulo: n.nome, entrega: r.entrega, fontes: r.fontes };
    } else if (n.tipo === 'multiagentes') {
      const r = await runMulti(n.id, {
        tid: nextTid(),
        from: null,
        objetivo: 'Revisar o conteúdo enviado',
        pedido: prompt,
        pacote: prompt,
      });
      res = { titulo: n.nome, entrega: r.entrega };
    } else {
      const r = await runSub(n.id, { texto: prompt }, null, nextTid());
      res = { titulo: n.nome, entrega: '```json\n' + JSON.stringify(r, null, 2) + '\n```' };
    }
    finish('ok', res);
  } catch (e) {
    const stopped = e.name === 'AbortError' || (S.run && S.run.abort.signal.aborted);
    finish(stopped ? 'stopped' : 'error', null, e);
  }
}
function finish(status, res, err) {
  const r = S.run;
  r.status = status;
  r.t1 = now();
  r.resultado = res;
  registrarQualidade(r, res?.checklist);
  stopTicker();
  clearInterval(statusTimer);
  uiRunning(false);
  $('#gate').hidden = true;
  for (const [id, st] of Object.entries(S.nstate))
    if (st === 'active' || st === 'consult')
      setState(id, status === 'ok' ? 'done' : status === 'error' ? 'error' : null);
  if (status !== 'ok')
    r.tasks.forEach((t) => {
      if (t.status === 'em andamento') t.status = status === 'error' ? 'erro' : 'interrompida';
    });
  if (err && status === 'error') ev('erro', null, null, err.message);
  $('#btnNext').hidden = true;
  renderTelemetry();
  renderInspector();
  renderConnPill();
  if ($('#optCam').checked && !r.camLivre) moverVista(viewToFit());
  Lud.aoTerminar(r);
  const calls = r.calls.length;
  const desfazer = S.anterior && r.kind !== 'exec' ? ' <button class="btn sm" id="btnDesfazer">Desfazer</button>' : '';
  const usados = S.foco ? ` · ${S.foco.size} de ${S.nodes.length} elementos usados` : '';
  if (res) {
    showResult(res);
    CHAT.turnos.push({ pedido: r.label, resposta: res.entrega });
    CHAT.demo = !!res.pergunta && r.demo;
    // Resposta a uma pergunta continua de onde o fluxo parou.
    if (res.pergunta) S.entrada = entradaDoRun;
    statusLine(`<span class="chip ok">Concluída</span> ${calls} chamada(s) em ${fmtMs(r.t1)}${usados}${desfazer}`);
    return;
  }
  // O que já ficou pronto não se perde quando a execução para antes do prompt final.
  const prontas = entregasDosAgentes(r);
  if (prontas.length)
    showResult({
      titulo: 'Entrega parcial',
      aviso: 'A execução parou antes do prompt final. Este é o que os agentes concluíram.',
      entrega: prontas.map((a) => `### ${nomeDe(a.id)}\n\n${a.entrega}`).join('\n\n'),
    });
  // Erro e interrupção entram no histórico: a linha de status é trocada a cada envio.
  chatAdd(
    `<div class="msg sis">${
      status === 'stopped'
        ? `<span class="chip warn">Interrompida</span> ${calls} chamada(s)`
        : `<span class="chip crit">Erro</span> ${esc(err ? err.message : 'falha')}`
    }</div>`,
  );
  statusLine(desfazer);
}
$('#statusLine').addEventListener('click', (e) => {
  if (e.target.id !== 'btnDesfazer' || !S.anterior) return;
  if (loadPackage(normalizeFiles(S.anterior))) {
    S.sujo = true;
    toast('Ecossistema anterior restaurado.', 'ok');
  }
});
function showResult(res) {
  const r = S.run;
  const sim = r && r.calls.every((c) => c.provider === 'sim');
  const baixar = res.pergunta ? '' : '<button class="btn sm baixar">Baixar .md</button>';
  const b = chatAdd(`<div class="card-box result"><div class="hd"><b>${esc(res.titulo || 'Resultado')}</b><span class="row-btns">${sim ? '<span class="chip">Simulação</span>' : ''}<button class="btn sm copiar">Copiar</button>${baixar}</span></div><div class="bd mdv">${res.resumo ? `<p class="hint-txt" style="margin-top:0">${esc(res.resumo)}</p>` : ''}${res.aviso ? `<div class="note warn">${esc(res.aviso)}</div>` : ''}${md(res.entrega)}${res.fontes && res.fontes.length ? `<p style="margin-top:10px"><b>Fontes:</b> ${res.fontes.map((f) => `<code>${esc(f)}</code>`).join(' ')}</p>` : ''}${res.checklist && res.checklist.length ? `<ul class="checks">${res.checklist.map((c) => `<li><span class="${c.ok ? 'y' : 'n'}">${c.ok ? '✓' : '✗'}</span>${esc(c.item)}</li>`).join('')}</ul>` : ''}${res.proximo ? `<p class="hint-txt" style="margin-top:10px">Próximo passo: ${esc(res.proximo)}</p>` : ''}${res.pergunta ? '' : rastreioHtml(r)}</div></div>`);
  const nomeArquivo = `${slugify(res.titulo || 'entrega')}-${r.turno || 1}.md`;
  const botao = b.querySelector('.baixar');
  if (botao) botao.onclick = () => saveFile(nomeArquivo, new Blob([arquivoDaEntrega(r, res)], { type: 'text/markdown' }));
  b.querySelector('.copiar').onclick = async () => {
    try {
      await navigator.clipboard.writeText(res.entrega);
      toast('Resultado copiado.', 'ok');
    } catch {
      const sel = getSelection(),
        rg = document.createRange();
      rg.selectNodeContents(b.querySelector('.bd'));
      sel.removeAllRanges();
      sel.addRange(rg);
      toast('Texto selecionado: use Ctrl+C para copiar.', 'warn');
    }
  };
}
const enviar = () => run({ demo: CHAT.demo });
$('#btnRun').onclick = enviar;
$('#btnNova').onclick = () => {
  if (!travado()) novaConversa();
};
$('#btnStop').onclick = () => {
  if (S.run) {
    S.run.abort.abort();
    finishGate({ action: 'stop' });
  }
};
// Enter envia e Shift+Enter quebra a linha, como nas plataformas web.
$('#prompt').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    if (!$('#btnRun').disabled) enviar();
  }
});
