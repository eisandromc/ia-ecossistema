// Mostra se o painel está pronto para rodar. Usa só módulos nativos do Node,
// porque precisa funcionar antes de existir um node_modules.
// Saída: 0 = pronto · 1 = bloqueado (Node antigo) · 2 = falta instalar módulos.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const criarEnv = process.argv.includes('--criar-env');
const NODE_MINIMO = 20;
const CHAVES = ['ANTHROPIC', 'OPENAI', 'GEMINI', 'MISTRAL', 'GROQ', 'DEEPSEEK', 'XAI', 'OPENROUTER'];

const lerJSON = (arquivo) => JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const linha = (ok, texto) => console.log(`  [${ok === true ? ' OK ' : ok === false ? 'FALTA' : 'INFO'}] ${texto}`);

function verificarNode() {
  const maior = Number(process.versions.node.split('.')[0]);
  const ok = maior >= NODE_MINIMO;
  linha(ok, `Node.js ${process.version} (mínimo: ${NODE_MINIMO})`);
  return ok;
}

function verificarNpm() {
  try {
    linha(true, `npm ${execSync('npm -v', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()}`);
    return true;
  } catch {
    linha(false, 'npm não encontrado. Ele vem junto com o Node.js.');
    return false;
  }
}

// Compara cada dependência instalada com a versão travada no package-lock.json.
function modulosPendentes() {
  const pacote = lerJSON(path.join(RAIZ, 'package.json'));
  const trava = path.join(RAIZ, 'package-lock.json');
  const travados = fs.existsSync(trava) ? lerJSON(trava).packages || {} : {};
  const pendentes = [];
  for (const nome of Object.keys(pacote.dependencies || {})) {
    const instalado = path.join(RAIZ, 'node_modules', ...nome.split('/'), 'package.json');
    if (!fs.existsSync(instalado)) {
      pendentes.push(`${nome} (não instalado)`);
      continue;
    }
    const esperado = travados[`node_modules/${nome}`]?.version;
    const atual = lerJSON(instalado).version;
    if (esperado && esperado !== atual) pendentes.push(`${nome} (${atual}, esperado ${esperado})`);
  }
  return pendentes;
}

function verificarEnv() {
  const env = path.join(RAIZ, '.env');
  if (!fs.existsSync(env)) {
    if (!criarEnv) {
      linha(null, '.env ainda não existe; será criado a partir do .env.example ao iniciar.');
      return;
    }
    fs.copyFileSync(path.join(RAIZ, '.env.example'), env);
    linha(true, '.env criado a partir do .env.example. Coloque suas chaves nele.');
  } else linha(true, '.env encontrado');

  const texto = fs.readFileSync(env, 'utf8');
  const comChave = CHAVES.filter((p) => new RegExp(`^${p}_API_KEY=[ \\t]*[^\\s#]`, 'm').test(texto));
  const local = /^(OLLAMA|CUSTOM)_BASE_URL=[ \t]*[^\s#]/m.test(texto);
  if (comChave.length) linha(true, `Chaves de API preenchidas: ${comChave.join(', ').toLowerCase()}`);
  else if (local) linha(true, 'Sem chaves de API, mas há um servidor local configurado.');
  else linha(null, 'Nenhuma chave no .env: o painel abre em modo Simulação, sem custo.');
}

console.log('\n  Painel da Fábrica de IA: verificação\n');
const nodeOk = verificarNode();
const npmOk = verificarNpm();
const pendentes = modulosPendentes();
if (pendentes.length) {
  linha(false, `Módulos do Node precisam ser instalados (${pendentes.length}):`);
  pendentes.forEach((p) => console.log(`           - ${p}`));
} else linha(true, 'Módulos do Node instalados: não precisa instalar nada.');
verificarEnv();
console.log('');

if (!nodeOk || (pendentes.length && !npmOk)) process.exit(1);
process.exit(pendentes.length ? 2 : 0);
