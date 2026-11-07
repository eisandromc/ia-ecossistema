'use strict';

/* ---------- narrador ---------- */
const nomeDe = (id) => {
  if (!id) return 'você';
  if (id === 'fabrica') return 'a Fábrica';
  const n = byId(id);
  return n ? n.nome : id;
};
const avaDe = (id) => {
  if (!id) return '🙋';
  if (id === 'fabrica') return '🏭';
  const n = byId(id);
  return n ? TYPES[n.tipo].ava : '🧭';
};

const Lud = {
  // Cada evento do motor vira uma frase em linguagem simples.
  aoEvento(e) {
    const de = `<b>${esc(nomeDe(e.from))}</b>`,
      para = `<b>${esc(nomeDe(e.to))}</b>`;
    if (e.type === 'handoff') {
      this.narrar('✉️', `${de} entregou um envelope para ${para}: ${esc(clip(e.text, 90))}`);
    } else if (e.type === 'retorno') {
      this.narrar('✅', `${de} devolveu o resultado para ${para}.`);
    } else if (e.type === 'consulta') {
      this.narrar('🔎', `${de} consultou ${para}: ${esc(e.text)}.`);
    } else if (e.type === 'portao') {
      this.narrar('🚧', `Portão! A execução parou e espera sua aprovação no painel à direita.`);
    } else if (e.type === 'erro') {
      this.narrar('⚠️', esc(clip(e.text, 140)));
    } else if (e.type === 'info' && e.from) {
      this.narrar(avaDe(e.from), `${de}: ${esc(clip(e.text, 110))}`);
    }
  },
  narrar(ava, html) {
    $('#narAva').textContent = ava;
    $('#narTxt').innerHTML = html;
  },
  narrarBoasVindas() {
    this.narrar(
      '🧭',
      `Clique no <b>+</b> do domínio para ver quem ele chama, ou assista à <b>Demonstração</b>, sem custo.`,
    );
  },
  aoTerminar(r) {
    if (r.status === 'ok') {
      this.narrar('✅', `Concluída: <b>${r.calls.length} chamada(s)</b> em ${fmtMs(r.t1)}. Clique na linha do tempo para abrir qualquer chamada.`);
    } else if (r.status === 'stopped') {
      this.narrar('⏹️', 'Execução interrompida.');
    }
  },
};

/* ---------- ritmo: velocidade e passo a passo ---------- */
function passo(texto) {
  const r = S.run;
  if (!r || !$('#optStep').checked) return Promise.resolve();
  // Com a execução já parada, o aviso de abort não dispara de novo e a promessa ficaria presa.
  if (r.abort.signal.aborted) return Promise.reject(abortErr());
  Lud.narrar('⏸️', `<b>Próximo:</b> ${esc(texto)}`);
  $('#btnNext').hidden = false;
  return new Promise((ok, falha) => {
    const item = { ok };
    r.fila.push(item);
    r.abort.signal.addEventListener(
      'abort',
      () => {
        $('#btnNext').hidden = true;
        falha(abortErr());
      },
      { once: true },
    );
  });
}
function proximoPasso() {
  const r = S.run;
  const item = r && r.fila.shift();
  if (!item) return;
  if (!r.fila.length) $('#btnNext').hidden = true;
  item.ok();
}
$('#btnNext').onclick = proximoPasso;
$('#btnDemo').onclick = () => demonstrar();
$$('[data-speed]').forEach((b) =>
  b.addEventListener('click', () => {
    S.speed = +b.dataset.speed;
    $$('[data-speed]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  }),
);
document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || $('#btnNext').hidden) return;
  if (e.target.closest('input,textarea,select,button,[role=button]')) return;
  e.preventDefault();
  proximoPasso();
});
