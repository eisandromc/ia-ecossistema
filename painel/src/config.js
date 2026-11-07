// Lê o .env e descreve os provedores de LLM. O arquivo é relido quando muda,
// então editar uma chave não exige reiniciar o servidor.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Pasta que guarda o painel e os diretórios de ecossistema.
export const RAIZ_ECOSSISTEMAS = path.dirname(RAIZ);
export const ENV_PATH = process.env.PAINEL_ENV || path.join(RAIZ, '.env');
// Registro local do que o painel leu do ecossistema conectado.
export const ECOSYSTEM_PATH = path.join(path.dirname(ENV_PATH), '.ecosystem');

// formato: 'anthropic' usa o SDK oficial; 'openai' usa POST {base}/chat/completions.
// modelos: lista inicial. A lista real vem do /models de cada provedor (ver llm.js).
export const CATALOGO = [
  {
    id: 'anthropic',
    nome: 'Anthropic',
    formato: 'anthropic',
    chave: 'ANTHROPIC_API_KEY',
    prefixo: 'ANTHROPIC',
    base: 'https://api.anthropic.com',
    modelos: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-fable-5-1'],
  },
  {
    id: 'openai',
    nome: 'OpenAI',
    formato: 'openai',
    chave: 'OPENAI_API_KEY',
    prefixo: 'OPENAI',
    base: 'https://api.openai.com/v1',
    limite: 'max_completion_tokens',
    modelos: ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'],
  },
  {
    id: 'gemini',
    nome: 'Google Gemini',
    formato: 'openai',
    chave: 'GEMINI_API_KEY',
    prefixo: 'GEMINI',
    base: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelos: [],
  },
  {
    id: 'mistral',
    nome: 'Mistral',
    formato: 'openai',
    chave: 'MISTRAL_API_KEY',
    prefixo: 'MISTRAL',
    base: 'https://api.mistral.ai/v1',
    modelos: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
  },
  {
    id: 'groq',
    nome: 'Groq',
    formato: 'openai',
    chave: 'GROQ_API_KEY',
    prefixo: 'GROQ',
    base: 'https://api.groq.com/openai/v1',
    modelos: [],
  },
  {
    id: 'deepseek',
    nome: 'DeepSeek',
    formato: 'openai',
    chave: 'DEEPSEEK_API_KEY',
    prefixo: 'DEEPSEEK',
    base: 'https://api.deepseek.com/v1',
    modelos: ['deepseek-v4-pro', 'deepseek-v4-flash'],
  },
  {
    id: 'xai',
    nome: 'xAI Grok',
    formato: 'openai',
    chave: 'XAI_API_KEY',
    prefixo: 'XAI',
    base: 'https://api.x.ai/v1',
    modelos: [],
  },
  {
    id: 'openrouter',
    nome: 'OpenRouter',
    formato: 'openai',
    chave: 'OPENROUTER_API_KEY',
    prefixo: 'OPENROUTER',
    base: 'https://openrouter.ai/api/v1',
    modelos: ['openrouter/auto'],
  },
  // Sem chave: valem assim que a URL base estiver no .env.
  {
    id: 'ollama',
    nome: 'Ollama (local)',
    formato: 'openai',
    chave: 'OLLAMA_API_KEY',
    prefixo: 'OLLAMA',
    base: '',
    local: true,
    modelos: [],
  },
  {
    id: 'custom',
    nome: 'Compatível com OpenAI',
    formato: 'openai',
    chave: 'CUSTOM_API_KEY',
    prefixo: 'CUSTOM',
    base: '',
    local: true,
    modelos: [],
  },
];

// Níveis da hierarquia que fazem chamadas ao modelo. Skills e RAG não chamam:
// o conteúdo deles entra no contexto de quem os consulta.
export const NIVEIS = ['dominio', 'orquestrador', 'multiagentes', 'workflow', 'agente', 'subagente', 'fabrica'];

let cache = { mtime: null, env: {} };

export function lerEnv() {
  let mtime = null;
  try {
    mtime = fs.statSync(ENV_PATH).mtimeMs;
  } catch {
    cache = { mtime: null, env: {} };
    return cache.env;
  }
  if (mtime !== cache.mtime) cache = { mtime, env: dotenv.parse(fs.readFileSync(ENV_PATH)) };
  return cache.env;
}

export const envExiste = () => fs.existsSync(ENV_PATH);

// Troca só a linha da variável. O arquivo guarda as chaves: a escrita passa por um
// temporário, para uma falha no meio nunca deixar o .env pela metade.
export function gravarEnv(nome, valor) {
  if (!envExiste()) return false;
  const atual = fs.readFileSync(ENV_PATH, 'utf8');
  const texto = /^[\w./-]+$/.test(valor) ? valor : `"${valor}"`;
  const linha = new RegExp(`^[ \\t]*${nome}=.*$`, 'm');
  const novo = linha.test(atual)
    ? atual.replace(linha, () => `${nome}=${texto}`)
    : `${atual}${atual.endsWith('\n') || !atual ? '' : '\n'}${nome}=${texto}\n`;
  if (novo === atual) return false;
  const temporario = `${ENV_PATH}.tmp`;
  fs.writeFileSync(temporario, novo);
  fs.chmodSync(temporario, fs.statSync(ENV_PATH).mode);
  fs.renameSync(temporario, ENV_PATH);
  return true;
}

const lista = (s) =>
  String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const inteiro = (s, padrao) => {
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : padrao;
};

// Provedor com os valores do .env já aplicados. A chave só existe aqui, no servidor.
export function provedor(id) {
  const env = lerEnv();
  const p = CATALOGO.find((x) => x.id === id);
  if (!p) return null;
  const base = (env[`${p.prefixo}_BASE_URL`] || p.base).trim().replace(/\/+$/, '');
  const chave = (env[p.chave] || '').trim();
  return {
    ...p,
    base,
    chaveValor: chave,
    configurado: p.local ? !!base : !!chave,
    modelosEnv: lista(env[`${p.prefixo}_MODELOS`]),
    cabecalhoChave: (env[`${p.prefixo}_KEY_HEADER`] || 'bearer').trim().toLowerCase(),
  };
}

export const provedores = () => CATALOGO.map((p) => provedor(p.id));

export function limites() {
  const env = lerEnv();
  return {
    maxTokens: inteiro(env.LLM_MAX_TOKENS, 16000),
    timeoutMs: inteiro(env.LLM_TIMEOUT_MS, 300000),
  };
}

// MODELO_PADRAO e MODELO_<NÍVEL>, no formato "provedor:modelo".
export function padroes() {
  const env = lerEnv();
  const niveis = {};
  for (const n of NIVEIS) niveis[n] = (env[`MODELO_${n.toUpperCase()}`] || '').trim();
  return { padrao: (env.MODELO_PADRAO || '').trim(), niveis };
}

export function porta() {
  return inteiro(process.env.PORTA || lerEnv().PORTA, 3210);
}

export function abrirNavegador() {
  return (lerEnv().PAINEL_ABRIR_NAVEGADOR || 'true').trim().toLowerCase() !== 'false';
}

export function dirEcossistema() {
  const d = (lerEnv().ECOSSISTEMA_DIR || '../ecossistema-educacional').trim();
  return path.resolve(RAIZ, d);
}
