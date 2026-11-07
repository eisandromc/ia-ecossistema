'use strict';

/* ---------- conexão: provedores do .env e modelo por nível ---------- */
const SIM = { provider: 'sim', model: '' };
const NIVEIS_LLM = ['dominio', 'orquestrador', 'multiagentes', 'workflow', 'agente', 'subagente', 'fabrica'];
const CHAVE_ESCOLHAS = 'painel.modelos';
const LLM = { provedores: [], padrao: '', niveis: {}, maxTokens: 0, envExiste: true };
// Sobreposições da aba Conexão e do inspetor. Ficam no navegador; o .env não muda.
const ESCOLHA = (() => {
  try {
    const j = JSON.parse(store.get(CHAVE_ESCOLHAS) || '{}');
    return { nivel: j.nivel || {}, no: j.no || {}, ativos: j.ativos || {}, desligados: j.desligados || {} };
  } catch {
    return { nivel: {}, no: {}, ativos: {}, desligados: {} };
  }
})();
// Filtro e grupos abertos na lista de modelos: sobrevivem a cada redesenho da aba.
const VISTA = { filtro: 'todos', dobras: {}, leitura: null };
const salvarEscolha = () => store.set(CHAVE_ESCOLHAS, JSON.stringify(ESCOLHA));

function parseAlvo(v) {
  if (!v) return null;
  if (v === 'sim' || v === 'simulacao') return SIM;
  const i = v.indexOf(':');
  return i > 0 ? { provider: v.slice(0, i), model: v.slice(i + 1) } : null;
}
const valorAlvo = (a) => (a.provider === 'sim' ? 'sim' : `${a.provider}:${a.model}`);
const provedorDe = (id) => LLM.provedores.find((p) => p.id === id);
// Com chave no .env, a conexão ainda pode ser desligada pelo interruptor da aba Conexão.
const provedorLigado = (p) => !!p?.configurado && !ESCOLHA.desligados[p.id];
// ok: tem chave e está conectado. warn: tem chave, mas não conectou ou foi desligado. off: sem chave.
function statusProvedor(p) {
  if (!p.configurado) return 'off';
  return provedorLigado(p) && p.online ? 'ok' : 'warn';
}
// Conectado não é o mesmo que em uso: só modelo ativado entra nas listas e nas execuções.
// O que já foi escolhido no .env ou nesta tela vale como ativado até ser desligado.
function modeloAtivo(v) {
  const citados = [LLM.padrao, ...Object.values(LLM.niveis), ...Object.values(ESCOLHA.nivel), ...Object.values(ESCOLHA.no)];
  return ESCOLHA.ativos[v] ?? citados.includes(v);
}
const alvoValido = (a) =>
  !!a && (a.provider === 'sim' || (!!a.model && provedorLigado(provedorDe(a.provider)) && modeloAtivo(valorAlvo(a))));
// Inclui os ativados que sumiram da lista, como os de um Ollama desligado: continuam à vista.
function modelosDe(p) {
  const prefixo = `${p.id}:`;
  const salvos = Object.keys(ESCOLHA.ativos)
    .filter((v) => v.startsWith(prefixo) && ESCOLHA.ativos[v])
    .map((v) => v.slice(prefixo.length));
  return [...new Set([...p.modelos, ...salvos])];
}
function alvoPadrao() {
  const a = parseAlvo(LLM.padrao);
  if (alvoValido(a)) return a;
  const prontos = LLM.provedores.filter(provedorLigado).sort((x, y) => y.online - x.online);
  for (const p of prontos) {
    const model = modelosDe(p).find((m) => modeloAtivo(`${p.id}:${m}`));
    if (model) return { provider: p.id, model };
  }
  return SIM;
}
const nivelDe = (id) => (id === 'fabrica' ? 'fabrica' : byId(id)?.tipo);
function herdado(nivel) {
  const candidatos = [ESCOLHA.nivel[nivel], LLM.niveis[nivel]].map(parseAlvo);
  return candidatos.find(alvoValido) || alvoPadrao();
}
function resolver(id) {
  const proprio = parseAlvo(ESCOLHA.no[id]);
  return alvoValido(proprio) ? proprio : herdado(nivelDe(id));
}
const rotuloAlvo = (a) => (a.provider === 'sim' ? '🎭 Simulação' : `🧠 ${a.model}`);
const fazChamada = (n) => NIVEIS_LLM.includes(n.tipo);
function rotuloNo(n) {
  return fazChamada(n) ? clip(rotuloAlvo(resolver(n.id)), 24) : '📎 é consultado';
}

function opcoesModelo(selecionado, primeira) {
  const grupos = LLM.provedores
    .filter(provedorLigado)
    .map((p) => {
      const modelos = modelosDe(p)
        .map((m) => `${p.id}:${m}`)
        .filter((v) => modeloAtivo(v));
      if (selecionado.startsWith(`${p.id}:`) && !modelos.includes(selecionado)) modelos.unshift(selecionado);
      const ops = modelos
        .map((v) => `<option value="${esc(v)}"${v === selecionado ? ' selected' : ''}>${esc(v.slice(p.id.length + 1))}</option>`)
        .join('');
      return ops ? `<optgroup label="${esc(p.nome)}">${ops}</optgroup>` : '';
    })
    .join('');
  const inicial = primeira ? `<option value=""${selecionado ? '' : ' selected'}>${esc(primeira)}</option>` : '';
  return `${inicial}<option value="sim"${selecionado === 'sim' ? ' selected' : ''}>🎭 Simulação (sem custo)</option>${grupos}`;
}

async function carregarProvedores(atualizar) {
  const r = await fetch(`/api/provedores${atualizar ? '?atualizar=1' : ''}`);
  if (!r.ok) throw new Error('O servidor do painel não respondeu.');
  Object.assign(LLM, await r.json());
}
function modelosEmUso() {
  const ids = S.nodes.filter(fazChamada).map((n) => n.id);
  return new Set(ids.map((id) => valorAlvo(resolver(id))));
}
function renderConnPill() {
  const usados = [...modelosEmUso()];
  const reais = usados.filter((v) => v !== 'sim');
  const b = $('#btnConn');
  b.dataset.st = reais.length ? 'ok' : 'idle';
  $('#connLabel').textContent = !reais.length
    ? 'Simulação'
    : reais.length === 1
      ? clip(parseAlvo(reais[0]).model, 22)
      : `${reais.length} modelos`;
  renderModoEnvio();
}
// Mostra, ao lado do prompt, quem vai responder e se isso gera custo.
function renderModoEnvio() {
  const usados = [...modelosEmUso()];
  const sel = $('#modoEscolha');
  sel.innerHTML = opcoesModelo(usados.length === 1 ? usados[0] : '', usados.length > 1 ? `${usados.length} modelos, por nível` : '');
  const custo = usados.some((v) => v !== 'sim');
  const chip = $('#modoCusto');
  chip.className = `chip ${custo ? 'warn' : ''}`;
  chip.textContent = custo ? 'gera custo' : 'sem custo';
}
function aplicarModeloATodos(valor) {
  NIVEIS_LLM.forEach((t) => (ESCOLHA.nivel[t] = valor));
  salvarEscolha();
  renderConn();
  aoMudarModelos();
  renderInspector();
}
$('#modoEscolha').addEventListener('change', (e) => {
  if (travado()) return renderModoEnvio();
  if (e.target.value) aplicarModeloATodos(e.target.value);
});
function statusModelo(p, m) {
  if (!p.configurado) return { chip: '', texto: p.local ? 'Sem URL' : 'Sem chave', dica: `Preencha ${p.variavel} no .env` };
  if (!provedorLigado(p)) return { chip: 'warn', texto: 'Desligado', dica: 'A conexão deste provedor está desligada' };
  if (!p.online) return { chip: 'warn', texto: 'Sem resposta', dica: p.erro || 'O provedor não respondeu' };
  if (p.vivos?.includes(m)) return { chip: 'ok', texto: 'Conectado', dica: 'O provedor confirmou este modelo' };
  return { chip: 'warn', texto: 'Não listado', dica: 'Veio do .env, mas o provedor não o listou' };
}
function casaFiltro(p, m) {
  if (VISTA.filtro === 'ativos') return modeloAtivo(`${p.id}:${m}`);
  if (VISTA.filtro === 'conectados') return statusModelo(p, m).chip === 'ok';
  return true;
}
function linhaModelo(p, m) {
  const v = `${p.id}:${m}`;
  const st = statusModelo(p, m);
  return `<label class="mdl"><span class="mdl-n" title="${esc(m)}">${esc(m)}</span><span class="chip ${st.chip}" title="${esc(st.dica)}">${st.texto}</span><input type="checkbox" role="switch" class="sw" data-ativo="${esc(v)}" aria-label="Ativar ${esc(m)}"${modeloAtivo(v) ? ' checked' : ''}${provedorLigado(p) ? '' : ' disabled'}></label>`;
}
function grupoProvedor(p) {
  const todos = modelosDe(p);
  const lista = todos.filter((m) => casaFiltro(p, m));
  const filtrando = VISTA.filtro !== 'todos';
  if (filtrando && !lista.length) return '';
  const st = statusProvedor(p);
  const ligado = provedorLigado(p);
  const ativos = todos.filter((m) => modeloAtivo(`${p.id}:${m}`)).length;
  const detalhe = !p.configurado
    ? `Preencha ${esc(p.variavel)} no .env`
    : !ligado
      ? `${p.chave ? `chave ${esc(p.chave)} · ` : ''}conexão desligada`
      : p.online
        ? `${p.chave ? `chave ${esc(p.chave)} · ` : ''}${ativos} de ${todos.length} ativo${todos.length === 1 ? '' : 's'}`
        : `Sem resposta do provedor${p.erro ? `: ${esc(clip(p.erro, 110))}` : ''}`;
  const vazio = p.configurado
    ? `O provedor não listou modelos. Defina ${esc(p.id.toUpperCase())}_MODELOS no .env.`
    : `A lista de modelos aparece quando ${esc(p.variavel)} estiver no .env.`;
  // Fechado até o clique.
  const aberto = !!VISTA.dobras[p.id];
  const dicaDot = { ok: 'Conectado', warn: 'Tem chave, mas não está conectado', off: 'Sem chave e sem conexão' }[st];
  const interruptor = `<input type="checkbox" role="switch" class="sw" data-conexao="${esc(p.id)}" aria-label="Ligar a conexão com ${esc(p.nome)}" title="${ligado ? 'Desligar' : 'Ligar'} a conexão"${ligado ? ' checked' : ''}${p.configurado ? '' : ' disabled'}>`;
  return `<details class="pvm" data-pvm="${esc(p.id)}"${aberto ? ' open' : ''}><summary class="pv" data-st="${st}" data-pv="${esc(p.id)}"><span class="seta" aria-hidden="true">▸</span><span class="dot" title="${dicaDot}"></span><div class="pv-t"><b>${esc(p.nome)}</b><small>${detalhe}</small><div class="pv-out"></div></div>${p.configurado ? `<button class="btn sm" data-testar="${esc(p.id)}"${ligado ? '' : ' disabled'}>Testar</button>` : ''}${interruptor}</summary><div class="mdls">${lista.map((m) => linhaModelo(p, m)).join('') || `<p class="hint-txt">${vazio}</p>`}</div></details>`;
}
function renderModelos() {
  const pares = LLM.provedores.flatMap((p) => modelosDe(p).map((m) => [p, m]));
  const conectados = pares.filter(([p, m]) => statusModelo(p, m).chip === 'ok').length;
  const ativos = pares.filter(([p, m]) => modeloAtivo(`${p.id}:${m}`)).length;
  const conta = (n, nome) => `${n} ${nome}${n === 1 ? '' : 's'}`;
  $('#mdlResumo').textContent = `${conta(pares.length, 'modelo')} · ${conta(conectados, 'conectado')} · ${conta(ativos, 'ativo')}`;
  const ordem = [...LLM.provedores].sort((a, b) => b.configurado - a.configurado);
  $('#pvLista').innerHTML = ordem.map(grupoProvedor).join('') || '<p class="empty">Nenhum modelo encontrado.</p>';
}
function renderConn() {
  const el = $('#connCorpo');
  const comChave = LLM.provedores.filter((p) => p.configurado);
  const prontos = comChave.filter(provedorLigado);
  const conectados = prontos.filter((p) => p.online);
  const tudoSimulado = conectados.length && NIVEIS_LLM.every((t) => herdado(t).provider === 'sim');
  const linhas = NIVEIS_LLM.map((t) => {
    const info = t === 'fabrica' ? { label: 'Fábrica', ava: '🏭' } : TYPES[t];
    const pai = herdado(t);
    const sel = ESCOLHA.nivel[t] || '';
    const invalido = sel && !alvoValido(parseAlvo(sel));
    const padrao = alvoValido(parseAlvo(LLM.niveis[t])) ? parseAlvo(LLM.niveis[t]) : alvoPadrao();
    return `<label class="nv"><span>${info.ava} ${info.label}</span><select data-nivel="${t}"${invalido ? ' class="bad"' : ''}>${opcoesModelo(sel, `Padrão: ${valorAlvo(padrao)}`.replace(': sim', ': Simulação'))}</select></label>${invalido ? `<p class="hint-txt bad">Modelo desativado ou sem conexão: usando ${esc(rotuloAlvo(pai))}.</p>` : ''}`;
  }).join('');
  const filtros = [
    ['todos', 'Todos'],
    ['conectados', 'Conectados'],
    ['ativos', 'Ativos'],
  ];
  el.innerHTML = `
    <div class="row-btns">
      <button class="btn" id="btnReload">Recarregar .env</button>
      <button class="btn" id="btnTestAll"${prontos.length ? '' : ' disabled'}>Testar todos</button>
    </div>
    <div id="ecoLeitura" hidden></div>
    ${LLM.envExiste ? '' : '<div class="note warn">Arquivo .env não encontrado. Rode o start.sh ou o start.bat para criá-lo.</div>'}
    ${comChave.length ? '' : '<div class="note">Nenhum provedor no .env ainda. O painel segue em <b>Simulação</b>, que mostra o fluxo completo sem custo.</div>'}
    ${comChave.length && !prontos.length ? '<div class="note warn">Todas as conexões estão desligadas. O painel segue em <b>Simulação</b>.</div>' : ''}
    ${tudoSimulado ? `<div class="note warn"><b>${esc(conectados.map((p) => p.nome).join(', '))}</b>: conectado, mas nenhum modelo ativado. O painel segue em Simulação até você ligar um modelo abaixo.</div>` : ''}
    <div class="rel"><h4>Modelos</h4><small class="hint-txt" id="mdlResumo"></small>
      <div class="eco-dir"><label class="fld" for="ecoDir">Ecossistema</label><div class="eco-row"><select id="ecoDir"${ECO.diretorios.length ? '' : ' disabled'}>${ECO.diretorios.map((d) => `<option value="${esc(d)}"${d === ECO.selecionado ? ' selected' : ''}>${esc(d)}</option>`).join('')}</select><button class="btn" id="btnCarregarEco"${ECO.diretorios.length ? '' : ' disabled'}>Carregar</button></div></div>
      <div class="seg" role="group" aria-label="Filtrar modelos">${filtros.map(([k, t]) => `<button data-filtro="${k}" aria-pressed="${VISTA.filtro === k}">${t}</button>`).join('')}</div>
      <div class="pvs" id="pvLista"></div>
    </div>
    <div class="rel"><h4>Modelo por nível da hierarquia</h4><div class="nvs"><label class="nv"><span>Todos os níveis</span><select id="todosNiveis">${opcoesModelo('', 'Aplicar a todos…')}</select></label>${linhas}</div></div>
    <div class="row-btns"><button class="btn sm" id="btnRestaurar">Voltar aos padrões do .env</button></div>
    <div class="note">As chaves ficam só no <code>.env</code>, neste computador. O navegador fala com o servidor local, e é ele quem chama cada provedor. Cada recurso acionado é uma chamada, cobrada pelo provedor. Máximo por chamada: ${fmtN(LLM.maxTokens)} tokens de saída. Com níveis no padrão, o primeiro modelo ativado atende a todos. Para trocar o modelo de um único recurso, use o inspetor.</div>`;
  renderModelos();
  renderLeitura();
  renderConnPill();
}
function aoMudarModelos() {
  renderNodes();
  renderConnPill();
}
function mostrarLeitura(tipo, html) {
  VISTA.leitura = { tipo, html };
  renderLeitura();
}
function renderLeitura() {
  const el = $('#ecoLeitura');
  if (!el) return;
  el.hidden = !VISTA.leitura;
  if (VISTA.leitura) {
    el.className = `note ${VISTA.leitura.tipo}`;
    el.innerHTML = VISTA.leitura.html;
  }
}
async function pedirLeitura({ provider, model }) {
  const r = await fetch('/api/ecossistema/leitura', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider, model }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `O servidor respondeu com erro ${r.status}.`);
  return j;
}
// Monta um pacote com a estrutura lida. O conteúdo de cada recurso continua na conta do provedor.
function pacoteDaConta(l) {
  const elementos = l.tipos.flatMap((t) => t.elementos);
  const arquivoDe = (e) => `${TYPES[e.tipo].dir}/${e.id}.md`;
  const raiz = (elementos.find((e) => e.tipo === 'dominio') || elementos[0]).id;
  const recursos = elementos.map((e) => ({ id: e.id, arquivo: arquivoDe(e), usa: e.usa }));
  const pacote = { 'ecosystem.yaml': jsyaml.dump({ nome: l.nome, versao: '1.0.0', raiz, recursos }) };
  for (const e of elementos) {
    const cabecalho = jsyaml.dump({ id: e.id, nome: e.nome, tipo: e.tipo, usa: e.usa });
    pacote[arquivoDe(e)] = `---\n${cabecalho}---\n# ${e.nome}\n\nPublicado em ${l.provedorNome} (${e.origem}, ${e.ref}). O conteúdo continua na conta do provedor.\n`;
  }
  return pacote;
}
function abrirDaConta(leitura) {
  if (emExecucao() || (S.nodes.length && retrato() !== baseDisco)) return false;
  if (!loadPackage(normalizeFiles(pacoteDaConta(leitura)))) return false;
  baseDisco = retrato();
  renderConnPill();
  novaConversa();
  return true;
}
function linhaLeitura(l) {
  const nome = `<b>${esc(l.provedorNome)}</b>`;
  const avisos = l.avisos.length ? ` Atenção, leitura incompleta: ${esc(l.avisos.join('; '))}.` : '';
  if (!l.suportado) return `${nome}: este provedor só expõe modelos, sem recursos publicados.`;
  if (!l.total) return `${nome}: conta conectada, ${l.inventario ? 'mas o que está nela não forma um ecossistema' : 'sem nada publicado'}.${avisos}`;
  const partes = l.tipos.map((t) => `<span class="nw">${TYPES[t.tipo].ava} ${esc(TYPES[t.tipo].label)} (${t.elementos.length})</span>`);
  const fora = l.fora.length ? ` ${l.fora.length} item(ns) da conta ficaram de fora.` : '';
  const inventados = l.inventados.length ? ` ${l.inventados.length} citado(s) pelo modelo não existem na conta e foram descartados.` : '';
  return `<b>${esc(l.nome)}</b>, lido de ${esc(l.provedorNome)} por ${esc(l.modelo)}: ${partes.join(' · ')}.${fora}${inventados}${avisos}`;
}
// Depois de um teste aprovado, a estrutura vem da conta do provedor, não dos arquivos locais.
async function lerEcossistemaDaConta(alvos) {
  mostrarLeitura('', '<span class="status-line"><span class="spin"></span>Lendo o ecossistema na conta…</span>');
  const linhas = [];
  let melhor = null;
  for (const alvo of alvos) {
    try {
      const l = await pedirLeitura(alvo);
      linhas.push(linhaLeitura(l));
      if (l.total > (melhor?.total || 0)) melhor = l;
    } catch (e) {
      linhas.push(`<b>${esc(provedorDe(alvo.provider).nome)}</b>: conexão aprovada, mas a leitura falhou: ${esc(e.message)}`);
    }
  }
  const carregou = !!melhor && abrirDaConta(melhor);
  const aberto = `<b>${esc(S.meta.nome)}</b>`;
  let fim = `O grafo segue com ${aberto}, que não veio desta leitura.`;
  if (carregou) fim = 'Grafo e legenda atualizados, e a leitura foi gravada em .ecosystem.';
  else if (melhor) fim = `Leitura gravada em .ecosystem, mas o grafo segue com ${aberto}: há alterações na tela ou uma execução em andamento.`;
  mostrarLeitura(
    carregou ? '' : 'warn',
    `${linhas.map((x) => `<div>${x}</div>`).join('')}<div>${fim}</div><div>Projetos do claude.ai e GPTs não são acessíveis pela chave de API: exporte os arquivos e use Arquivo → Importar pacote.</div>`,
  );
}
async function testarProvedor(id) {
  const p = provedorDe(id);
  const out = $(`[data-pv="${CSS.escape(id)}"] .pv-out`);
  const emUso = [...modelosEmUso()].map(parseAlvo).find((a) => a.provider === id);
  const model = emUso?.model || p.modelos[0];
  if (!model) {
    out.innerHTML = `<span class="chip crit">Sem modelo</span> defina ${esc(id.toUpperCase())}_MODELOS no .env`;
    return null;
  }
  out.innerHTML = '<span class="status-line"><span class="spin"></span>Testando…</span>';
  const t0 = performance.now();
  try {
    const r = await callProvider({
      provider: id,
      model,
      system: 'Você é um verificador de conexão.',
      user: 'Responda apenas com a palavra OK.',
    });
    out.innerHTML = `<span class="chip ok">Conectado</span> ${esc(clip(model, 26))} · ${fmtMs(performance.now() - t0)} · “${esc(clip(r.text.trim(), 20))}”`;
    return { provider: id, model };
  } catch (e) {
    out.innerHTML = `<span class="chip crit">Falhou</span> ${esc(e.message)}`;
    return null;
  }
}
$('#paneconn').addEventListener('click', async (e) => {
  const teste = e.target.closest('[data-testar]');
  if (teste) {
    e.preventDefault(); // o botão fica dentro do <summary>: sem isto, abriria e fecharia o grupo
    const alvo = await testarProvedor(teste.dataset.testar);
    if (alvo) await lerEcossistemaDaConta([alvo]);
    return;
  }
  if (e.target.id === 'btnCarregarEco') return carregarEcossistema(e.target);
  const filtro = e.target.closest('[data-filtro]');
  if (filtro) {
    VISTA.filtro = filtro.dataset.filtro;
    $$('[data-filtro]').forEach((b) => b.setAttribute('aria-pressed', String(b === filtro)));
    return renderModelos();
  }
  if (e.target.id === 'btnTestAll') {
    const testes = await Promise.all(LLM.provedores.filter(provedorLigado).map((p) => testarProvedor(p.id)));
    if (testes.some(Boolean)) await lerEcossistemaDaConta(testes.filter(Boolean));
  }
  if (e.target.id === 'btnReload') {
    e.target.disabled = true;
    try {
      await carregarProvedores(true);
      renderConn();
      aoMudarModelos();
      renderInspector();
      toast('.env recarregado.', 'ok');
    } catch (err) {
      e.target.disabled = false;
      toast(err.message, 'crit');
    }
  }
  if (e.target.id === 'btnRestaurar') {
    ESCOLHA.nivel = {};
    ESCOLHA.no = {};
    ESCOLHA.ativos = {};
    ESCOLHA.desligados = {};
    salvarEscolha();
    renderConn();
    aoMudarModelos();
    renderInspector();
  }
});
// toggle não borbulha: só a captura enxerga o abrir e fechar dos grupos.
$('#paneconn').addEventListener(
  'toggle',
  (e) => {
    const id = e.target.dataset?.pvm;
    if (id) VISTA.dobras[id] = e.target.open;
  },
  true,
);
$('#paneconn').addEventListener('change', (e) => {
  if (e.target.id === 'ecoDir') {
    ECO.selecionado = e.target.value;
    return;
  }
  const { ativo, conexao } = e.target.dataset;
  if (ativo || conexao) {
    // Trocar de modelo no meio de uma execução mudaria quem responde às próximas chamadas.
    if (travado()) return renderConn();
    if (ativo) ESCOLHA.ativos[ativo] = e.target.checked;
    else if (e.target.checked) delete ESCOLHA.desligados[conexao];
    else ESCOLHA.desligados[conexao] = true;
    salvarEscolha();
    renderConn();
    aoMudarModelos();
    renderInspector();
    $(ativo ? `[data-ativo="${CSS.escape(ativo)}"]` : `[data-conexao="${CSS.escape(conexao)}"]`)?.focus();
    return;
  }
  if (e.target.id === 'todosNiveis') {
    if (e.target.value) aplicarModeloATodos(e.target.value);
    return;
  }
  const t = e.target.dataset.nivel;
  if (!t) return;
  if (e.target.value) ESCOLHA.nivel[t] = e.target.value;
  else delete ESCOLHA.nivel[t];
  salvarEscolha();
  renderConn();
  aoMudarModelos();
});
$('#btnConn').onclick = () => rtab('conn');

async function callProvider({ provider, model, system, user, signal }) {
  let r;
  try {
    r = await fetch('/api/chat', {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider, model, system, user }),
    });
  } catch (e) {
    if (e.name === 'AbortError') throw abortErr();
    throw new Error('O servidor do painel não respondeu. Confira se ele continua rodando no terminal.');
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `O servidor respondeu com erro ${r.status}.`);
  return j;
}
