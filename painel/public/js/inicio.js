'use strict';

/* ---------- início ---------- */
(async () => {
  Lud.narrarBoasVindas();
  try {
    await carregarProvedores();
  } catch (e) {
    toast(e.message, 'crit');
  }
  let arquivos;
  try {
    await carregarDiretorios();
    renderConn();
    arquivos = await buscarConectado();
  } catch (e) {
    return toast(`Não consegui carregar o ecossistema: ${e.message}`, 'crit');
  }
  abrirConectado(arquivos);
})();
