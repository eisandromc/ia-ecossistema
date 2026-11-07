// Servidor local do painel: entrega a interface e faz a ponte com os LLMs.
import { spawn } from 'node:child_process';
import path from 'node:path';
import express from 'express';
import { abrirNavegador, dirEcossistema, ENV_PATH, envExiste, gravarEnv, limites, padroes, porta, RAIZ, RAIZ_ECOSSISTEMAS } from './src/config.js';
import { lerDaConta } from './src/conta.js';
import { lerPacote, listarEcossistemas } from './src/ecossistema.js';
import { chamar, ErroLLM, listarProvedores } from './src/llm.js';

const HOST = '127.0.0.1';
const TENTATIVAS_PORTA = 10;
const HOST_LOCAL = /^(localhost|127\.0\.0\.1)(:\d+)?$/;

const app = express();
app.disable('x-powered-by');

// As chaves ficam neste processo. Só a própria página pode acionar a API:
// isso impede que um site aberto em outra aba gaste suas chaves via localhost.
function somenteLocal(req, res, next) {
  const host = req.headers.host || '';
  const origem = req.headers.origin;
  if (!HOST_LOCAL.test(host) || (origem && origem !== `http://${host}`)) {
    return res.status(403).json({ error: 'Acesso permitido apenas pelo próprio painel.' });
  }
  next();
}

app.use('/api', somenteLocal, express.json({ limit: '4mb' }));

app.get('/api/provedores', async (req, res, next) => {
  try {
    const forcar = req.query.atualizar === '1';
    res.json({ provedores: await listarProvedores(forcar), ...padroes(), ...limites(), envExiste: envExiste() });
  } catch (e) {
    next(e);
  }
});

app.get('/api/ecossistemas', (_req, res, next) => {
  try {
    res.json({ diretorios: listarEcossistemas(), padrao: path.basename(dirEcossistema()) });
  } catch (e) {
    next(e);
  }
});

app.get('/api/ecossistema', (req, res, next) => {
  try {
    const { dir } = req.query;
    // Só nomes da lista: o caminho nunca vem do pedido.
    if (dir !== undefined && !listarEcossistemas().includes(dir)) {
      return res.status(404).json({ error: 'Diretório de ecossistema não encontrado.' });
    }
    res.json({ arquivos: lerPacote(dir ? path.join(RAIZ_ECOSSISTEMAS, dir) : dirEcossistema()) });
  } catch (e) {
    next(e);
  }
});

app.post('/api/ecossistema/selecao', (req, res, next) => {
  try {
    const { dir } = req.body || {};
    if (!listarEcossistemas().includes(dir) || dir.includes('"')) {
      return res.status(404).json({ error: 'Diretório de ecossistema não encontrado.' });
    }
    res.json({ gravado: gravarEnv('ECOSSISTEMA_DIR', `../${dir}`) });
  } catch (e) {
    next(e);
  }
});

app.post('/api/ecossistema/leitura', async (req, res, next) => {
  const { provider, model } = req.body || {};
  if (typeof provider !== 'string' || typeof model !== 'string') {
    return res.status(400).json({ error: 'Pedido inválido: faltam provider e model.' });
  }
  const controle = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controle.abort();
  });
  try {
    res.json(await lerDaConta({ provider, model }, controle.signal));
  } catch (e) {
    if (controle.signal.aborted) return;
    next(e);
  }
});

app.post('/api/chat', async (req, res, next) => {
  const { provider, model, system, user } = req.body || {};
  if (typeof system !== 'string' || typeof user !== 'string') {
    return res.status(400).json({ error: 'Pedido inválido: faltam system e user.' });
  }
  // Se o navegador cancelar, a chamada ao provedor também para de consumir.
  const controle = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) controle.abort();
  });
  const inicio = Date.now();
  try {
    const r = await chamar({ provider, model, system, user }, controle.signal);
    res.json({ ...r, ms: Date.now() - inicio });
  } catch (e) {
    if (controle.signal.aborted) return;
    next(e);
  }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

const estatico = (dir) => express.static(path.join(RAIZ, dir), { index: false, dotfiles: 'ignore' });
app.get('/vendor/js-yaml.min.js', (_req, res) => res.sendFile(path.join(RAIZ, 'node_modules/js-yaml/dist/js-yaml.min.js')));
app.get('/vendor/jszip.min.js', (_req, res) => res.sendFile(path.join(RAIZ, 'node_modules/jszip/dist/jszip.min.js')));
app.use(estatico('public'));
app.get('/', (_req, res) => res.sendFile(path.join(RAIZ, 'public/index.html')));

app.use((erro, _req, res, _next) => {
  if (erro.type === 'entity.too.large')
    return res.status(413).json({ error: 'O pedido ficou grande demais para o servidor do painel (limite de 4 MB).' });
  if (!(erro instanceof ErroLLM)) console.error(erro);
  res.status(erro.status || 500).json({ error: erro.message });
});

function abrir(url) {
  const [cmd, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];
  const filho = spawn(cmd, args, { stdio: 'ignore', detached: true });
  filho.on('error', () => {});
  filho.unref();
}

function iniciar(numero, restantes) {
  // O Express 5 também chama este callback com o erro de listen; quem trata é o on('error').
  const servidor = app.listen(numero, HOST, (erro) => {
    if (erro) return;
    const url = `http://localhost:${numero}`;
    console.log(`\n  Painel da Fábrica de IA em ${url}`);
    console.log(envExiste() ? `  Configuração: ${ENV_PATH}` : '  Sem .env: rodando só com a simulação.');
    console.log('  Ctrl+C para encerrar.\n');
    if (process.argv.includes('--abrir') && abrirNavegador()) abrir(url);
  });
  servidor.on('error', (e) => {
    if (e.code === 'EADDRINUSE' && restantes > 0) {
      console.log(`  Porta ${numero} ocupada, tentando ${numero + 1}...`);
      iniciar(numero + 1, restantes - 1);
      return;
    }
    console.error(`Não consegui iniciar o servidor: ${e.message}`);
    process.exit(1);
  });
}

iniciar(porta(), TENTATIVAS_PORTA);
