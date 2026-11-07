'use strict';

let PKG = {};
let baseDisco = ''; // retrato do pacote como veio do disco, para saber se a tela ainda é igual a ele
const retrato = () => JSON.stringify(exportFiles());

/* ---------- ecossistema conectado: o que está em ECOSSISTEMA_DIR ---------- */
// atual: a pasta aplicada ao painel. selecionado: o que está no select, aplicado só pelo botão Carregar.
const ECO = { diretorios: [], atual: '', selecionado: '' };
async function carregarDiretorios() {
  const r = await fetch('/api/ecossistemas');
  if (!r.ok) throw new Error('O servidor do painel não listou os ecossistemas.');
  const { diretorios, padrao } = await r.json();
  ECO.diretorios = diretorios;
  // ECOSSISTEMA_DIR fora da raiz não está na lista: abre pelo .env, sem escolher pasta.
  ECO.atual = diretorios.includes(padrao) ? padrao : '';
  ECO.selecionado = ECO.atual || diretorios[0] || '';
  renderMenuEcossistema();
}
function renderMenuEcossistema() {
  $('#ecoMenu').innerHTML = ECO.diretorios
    .map((d) => `<button data-eco="${esc(d)}">${esc(d)}${d === ECO.atual ? '<small>Aberto agora</small>' : ''}</button>`)
    .join('');
}
$('#ecoMenu').addEventListener('click', (e) => {
  const b = e.target.closest('[data-eco]');
  if (!b) return;
  ECO.selecionado = b.dataset.eco;
  const campo = $('#ecoDir');
  if (campo) campo.value = ECO.selecionado;
  carregarEcossistema($('#btnEco'));
});
async function buscarConectado() {
  const r = await fetch(`/api/ecossistema${ECO.atual ? `?dir=${encodeURIComponent(ECO.atual)}` : ''}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `O servidor respondeu com erro ${r.status}.`);
  return j.arquivos;
}
function abrirConectado(arquivos) {
  for (const [p, c] of Object.entries(arquivos)) if (KIT_RE.test(p)) S.kit[p] = c;
  if (!loadPackage(normalizeFiles(arquivos))) return false;
  PKG = arquivos;
  baseDisco = retrato();
  renderConnPill();
  novaConversa();
  return true;
}
async function gravarSelecao(dir) {
  const r = await fetch('/api/ecossistema/selecao', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ dir }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `O servidor respondeu com erro ${r.status}.`);
}
// Busca a pasta selecionada e aplica ao painel. Só o que abriu de verdade vai para o .env.
async function carregarEcossistema(botao) {
  const alterado = S.nodes.length && retrato() !== baseDisco;
  if (travado() || (alterado && !confirm('O ecossistema aberto tem alterações. Carregar agora vai descartá-las. Continuar?'))) return;
  const anterior = ECO.atual;
  ECO.atual = ECO.selecionado;
  botao.disabled = true;
  try {
    if (!abrirConectado(await buscarConectado())) throw new Error('o pacote não pôde ser aberto');
    VISTA.leitura = null;
    renderLeitura();
  } catch (e) {
    ECO.atual = anterior;
    toast(`Não consegui carregar o ecossistema: ${e.message}`, 'crit');
    return;
  } finally {
    botao.disabled = false;
  }
  renderMenuEcossistema();
  try {
    await gravarSelecao(ECO.atual);
    toast(`${ECO.atual}: ${S.nodes.length} recursos carregados e salvos no .env.`, 'ok');
  } catch (e) {
    toast(`${ECO.atual} foi carregado, mas não consegui gravar no .env: ${e.message}`, 'warn');
  }
}

/* ---------- arquivo: importar / exportar ---------- */
function marcarMenu(menu, aberto) {
  menu.hidden = !aberto;
  menu.previousElementSibling.setAttribute('aria-expanded', String(aberto));
}
for (const [botao, menu] of [['#btnFile', '#fileMenu'], ['#btnEco', '#ecoMenu'], ['#btnExibir', '#exibirMenu']]) {
  $(botao).addEventListener('click', () => marcarMenu($(menu), $(menu).hidden));
}
// Clicar fora ou escolher uma ação fecha o menu; marcar uma opção mantém aberto.
document.addEventListener('click', (e) => {
  const dentro = e.target.closest('.menu-wrap');
  const acao = e.target.closest('.menu button');
  $$('.menu').forEach((m) => {
    if (m.closest('.menu-wrap') !== dentro || acao) marcarMenu(m, false);
  });
});
$('#fileMenu').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  $('#fileMenu').hidden = true;
  const a = b.dataset.act;
  if (a === 'import') $('#fileImport').click();
  if (a === 'example') {
    if (abrirConectado(PKG)) toast(`${ECO.atual || S.meta.nome} reaberto.`, 'ok');
  }
  if (a === 'gen' || a === 'evo') pedirFabrica(a);
  if (a === 'zip') exportZip();
  if (a === 'single') {
    const f = exportFiles();
    const order = [
      'ecosystem.yaml',
      ...Object.keys(f)
        .filter((p) => p !== 'ecosystem.yaml')
        .sort(),
    ];
    const txt =
      `# ${S.meta.nome} v${S.meta.versao} — pacote em arquivo único\n\nCada arquivo começa com \`===== ARQUIVO: <caminho> =====\`. Para instalar, anexe este arquivo e cole o INSTALL.md.\n` +
      order.map((p) => `\n===== ARQUIVO: ${p} =====\n${f[p].trimEnd()}`).join('\n') +
      '\n';
    saveFile(
      `${slugify(S.meta.nome) || 'ecossistema'}-completo.md`,
      new Blob([txt], { type: 'text/markdown' }),
    );
    S.sujo = false;
  }
  if (a === 'telemetry') {
    if (!S.run) return toast('Nenhuma execução registrada ainda.', 'warn');
    const r = S.run;
    saveFile(
      `telemetria-${slugify(S.meta.nome)}-${Date.now()}.json`,
      new Blob(
        [
          JSON.stringify(
            {
              ecossistema: S.meta.nome,
              versao: S.meta.versao,
              modo: r.kind,
              pedido: r.label,
              modelos: [...new Set(r.calls.map((c) => c.alvo))],
              status: r.status,
              duracao_ms: Math.round(r.t1 ?? now()),
              chamadas: r.calls.map((c) => ({
                recurso: c.node,
                tipo: c.kind,
                modelo: c.alvo,
                inicio_ms: Math.round(c.start),
                fim_ms: Math.round(c.end ?? 0),
                tokens_entrada: c.tin,
                tokens_saida: c.tout,
                estimado: c.est,
                ok: c.ok,
                erro: c.err,
              })),
              eventos: r.events.map((e) => ({
                t_ms: Math.round(e.t),
                tipo: e.type,
                de: e.from,
                para: e.to,
                texto: e.text,
              })),
              tarefas: r.tasks,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      ),
    );
  }
});
$('#fileImport').onchange = async (e) => {
  const fl = [...e.target.files];
  if (!fl.length) return;
  const raw = {};
  try {
    for (const f of fl) {
      if (/\.zip$/i.test(f.name)) {
        const z = await JSZip.loadAsync(f);
        for (const [p, en] of Object.entries(z.files)) {
          if (en.dir || !/\.(md|ya?ml|py|txt|json|csv)$/i.test(p)) continue;
          raw[p] = await en.async('string');
        }
      } else {
        const t = await f.text();
        if (/^=====\s*ARQUIVO:/m.test(t)) Object.assign(raw, splitSingle(t));
        else raw[f.webkitRelativePath || f.name] = t;
      }
    }
  } catch (err) {
    e.target.value = '';
    toast('Não consegui ler o arquivo: ' + err.message, 'crit');
    return;
  }
  if (loadPackage(normalizeFiles(raw)))
    toast(`${S.nodes.length} recursos carregados de ${fl.map((f) => f.name).join(', ')}.`, 'ok');
  e.target.value = '';
};
const cw = $('#canvasWrap');
cw.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('drop-over');
});
cw.addEventListener('dragleave', () => document.body.classList.remove('drop-over'));
cw.addEventListener('drop', (e) => {
  e.preventDefault();
  document.body.classList.remove('drop-over');
  const dt = new DataTransfer();
  [...e.dataTransfer.files].forEach((f) => dt.items.add(f));
  $('#fileImport').files = dt.files;
  $('#fileImport').dispatchEvent(new Event('change'));
});
async function exportZip() {
  const zip = new JSZip();
  const root = slugify(S.meta.nome) || 'ecossistema';
  const f = exportFiles();
  for (const [p, c] of Object.entries(f)) zip.file(`${root}/${p}`, c);
  const blob = await zip.generateAsync({ type: 'blob' });
  saveFile(`${root}-v${S.meta.versao || '1.0.0'}.zip`, blob);
  S.sujo = false;
}
// O ecossistema vive na memória da página: avisa antes de fechar com trabalho não exportado.
addEventListener('beforeunload', (e) => {
  if (S.sujo || emExecucao()) e.preventDefault();
});
async function saveFile(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`${name} gerado.`, 'ok');
}
