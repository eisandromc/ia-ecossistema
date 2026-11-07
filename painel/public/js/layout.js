'use strict';

/* ---------- layout: tamanho e visibilidade dos painéis ---------- */
const CHAVE_LAYOUT = 'painel.layout';
const PAINEIS = {
  esq: { css: '--w-esq', padrao: 262, min: 180, max: 520, nome: 'Hierarquia' },
  dir: { css: '--w-dir', padrao: 404, min: 300, max: 760, nome: 'painel direito' },
  base: { css: '--h-base', padrao: 216, min: 130, max: 560, nome: 'Telemetria' },
};
const MAPA_MIN = { largura: 360, altura: 220 };
const PASSO_TECLA = 16;
const SEPARADOR = 12;
const LAY = (() => {
  try {
    const j = JSON.parse(store.get(CHAVE_LAYOUT) || '{}');
    return { tam: { ...j.tam }, ocultos: { ...j.ocultos }, antes: j.antes || null };
  } catch {
    return { tam: {}, ocultos: {}, antes: null };
  }
})();
const work = $('.work');
const salvarLayout = () => store.set(CHAVE_LAYOUT, JSON.stringify(LAY));
const tudoOculto = () => Object.keys(PAINEIS).every((k) => LAY.ocultos[k]);

// Nenhum painel pode apertar o mapa abaixo do mínimo, nem depois de a janela encolher.
function limiteDe(chave) {
  const { min, max } = PAINEIS[chave];
  if (chave === 'base') {
    // Barra de ferramentas, narração e legenda dividem a coluna com o mapa.
    const moldura = $('#canvasWrap').offsetHeight - $('#graph').clientHeight;
    return Math.max(min, Math.min(max, $('.center').clientHeight - moldura - MAPA_MIN.altura - SEPARADOR));
  }
  const outro = chave === 'esq' ? 'dir' : 'esq';
  const estilo = getComputedStyle(work);
  const util = work.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
  const ocupado = LAY.ocultos[outro] ? 0 : (LAY.tam[outro] ?? PAINEIS[outro].padrao) + SEPARADOR;
  return Math.max(min, Math.min(max, util - ocupado - SEPARADOR - MAPA_MIN.largura));
}
function tamanhoDe(chave) {
  const { padrao, min } = PAINEIS[chave];
  return Math.max(min, Math.min(limiteDe(chave), LAY.tam[chave] ?? padrao));
}
function aplicarLayout() {
  for (const [chave, p] of Object.entries(PAINEIS)) {
    const v = Math.round(tamanhoDe(chave));
    work.style.setProperty(p.css, `${v}px`);
    work.classList.toggle(`sem-${chave}`, !!LAY.ocultos[chave]);
    const sep = $(`.split[data-split="${chave}"]`);
    sep.setAttribute('aria-valuenow', v);
    sep.setAttribute('aria-valuemin', p.min);
    sep.setAttribute('aria-valuemax', Math.round(limiteDe(chave)));
    $(`[data-painel="${chave}"]`).setAttribute('aria-pressed', String(!LAY.ocultos[chave]));
  }
  const b = $('#btnSoMapa');
  b.setAttribute('aria-pressed', String(tudoOculto()));
  b.textContent = tudoOculto() ? 'Mostrar painéis' : 'Só o mapa';
}
function concluirLayout() {
  LAY.antes = tudoOculto() ? LAY.antes : null;
  salvarLayout();
  aplicarLayout();
  requestAnimationFrame(fit);
}
function alternarPainel(chave) {
  LAY.ocultos[chave] = !LAY.ocultos[chave];
  concluirLayout();
}
function mostrarPainel(chave) {
  if (!LAY.ocultos[chave]) return;
  delete LAY.ocultos[chave];
  concluirLayout();
}
function alternarSoMapa() {
  if (tudoOculto()) {
    LAY.ocultos = LAY.antes || {};
    LAY.antes = null;
    salvarLayout();
    aplicarLayout();
    return requestAnimationFrame(fit);
  }
  LAY.antes = { ...LAY.ocultos };
  LAY.ocultos = { esq: true, dir: true, base: true };
  salvarLayout();
  aplicarLayout();
  requestAnimationFrame(fit);
}
$$('[data-painel]').forEach((b) => (b.onclick = () => alternarPainel(b.dataset.painel)));
$('#btnSoMapa').onclick = alternarSoMapa;

// Para que lado o arraste aumenta o painel.
const SENTIDO = { esq: ['clientX', 1], dir: ['clientX', -1], base: ['clientY', -1] };
const TECLAS = { esq: ['ArrowRight', 'ArrowLeft'], dir: ['ArrowLeft', 'ArrowRight'], base: ['ArrowUp', 'ArrowDown'] };
function definirTamanho(chave, valor) {
  LAY.tam[chave] = Math.max(PAINEIS[chave].min, Math.min(limiteDe(chave), valor));
  aplicarLayout();
}
$$('.split').forEach((sep) => {
  const chave = sep.dataset.split;
  const [eixo, sinal] = SENTIDO[chave];
  sep.setAttribute('aria-label', `Ajustar o tamanho: ${PAINEIS[chave].nome}`);
  sep.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const inicio = e[eixo];
    const base = tamanhoDe(chave);
    sep.setPointerCapture(e.pointerId);
    document.body.classList.add('arrastando', chave === 'base' ? 'arrastando-h' : 'arrastando-v');
    const mover = (m) => definirTamanho(chave, base + (m[eixo] - inicio) * sinal);
    const soltar = () => {
      sep.removeEventListener('pointermove', mover);
      sep.removeEventListener('pointerup', soltar);
      sep.removeEventListener('pointercancel', soltar);
      document.body.classList.remove('arrastando', 'arrastando-h', 'arrastando-v');
      concluirLayout();
    };
    sep.addEventListener('pointermove', mover);
    sep.addEventListener('pointerup', soltar);
    sep.addEventListener('pointercancel', soltar);
  });
  sep.addEventListener('dblclick', () => {
    delete LAY.tam[chave];
    concluirLayout();
  });
  sep.addEventListener('keydown', (e) => {
    const [cresce, encolhe] = TECLAS[chave];
    if (e.key !== cresce && e.key !== encolhe) return;
    e.preventDefault();
    definirTamanho(chave, tamanhoDe(chave) + (e.key === cresce ? PASSO_TECLA : -PASSO_TECLA));
    concluirLayout();
  });
});
addEventListener('resize', aplicarLayout);
aplicarLayout();

const CHAVE_LEGENDA = 'painel.legenda';
function mostrarLegenda(aberta) {
  $('#legend').hidden = !aberta;
  $('#btnLegenda').setAttribute('aria-pressed', String(aberta));
}
mostrarLegenda(store.get(CHAVE_LEGENDA) === '1');
$('#btnLegenda').onclick = () => {
  const aberta = $('#legend').hidden;
  store.set(CHAVE_LEGENDA, aberta ? '1' : '0');
  mostrarLegenda(aberta);
  requestAnimationFrame(fit);
};
