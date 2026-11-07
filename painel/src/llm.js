// Fala com os provedores de LLM. Toda chamada sai daqui, então a chave nunca vai ao navegador.
import Anthropic from '@anthropic-ai/sdk';
import { limites, provedor, provedores } from './config.js';

const TEMPO_MODELOS_MS = 5000;
const CACHE_MODELOS_MS = 10 * 60 * 1000;
const NAO_CHAT = /embed|tts|whisper|dall-e|image|audio|realtime|moderation|transcribe|sora|rerank|ocr|guard/i;

export class ErroLLM extends Error {
  constructor(mensagem, status = 502) {
    super(mensagem);
    this.status = status;
  }
}

const mascarar = (texto, chave) => (chave ? String(texto).split(chave).join('••••') : String(texto));

function erroPorStatus(p, status, detalhe) {
  const d = mascarar(detalhe || '', p.chaveValor).slice(0, 300);
  const fim = d ? ` ${d}` : '';
  if (status === 401 || status === 403)
    return new ErroLLM(`${p.nome} recusou a chave (${status}). Confira ${p.chave} no .env.${fim}`, 502);
  if (status === 404)
    return new ErroLLM(`${p.nome}: modelo ou endpoint não encontrado (404). Confira o modelo.${fim}`, 502);
  if (status === 429)
    return new ErroLLM(`${p.nome} limitou as chamadas (429). Aguarde um pouco e execute de novo.${fim}`, 429);
  if (status === 400) return new ErroLLM(`${p.nome} recusou o pedido (400).${fim}`, 502);
  return new ErroLLM(`${p.nome} respondeu com erro ${status}.${fim}`, 502);
}

function clienteAnthropic(p, timeout) {
  const opcoes = { apiKey: p.chaveValor, authToken: null, maxRetries: 2, timeout };
  if (p.base !== 'https://api.anthropic.com') opcoes.baseURL = p.base;
  return new Anthropic(opcoes);
}

async function chamarAnthropic(p, { model, system, user }, signal) {
  const { maxTokens, timeoutMs } = limites();
  try {
    const r = await clienteAnthropic(p, timeoutMs).messages.create(
      { model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] },
      { signal },
    );
    if (r.stop_reason === 'refusal') throw new ErroLLM(`${p.nome} recusou responder a este pedido.`, 502);
    return {
      text: r.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join(''),
      tin: r.usage?.input_tokens,
      tout: r.usage?.output_tokens,
      parada: r.stop_reason,
    };
  } catch (e) {
    if (e instanceof ErroLLM) throw e;
    if (e instanceof Anthropic.APIUserAbortError) throw e;
    if (e instanceof Anthropic.APIConnectionTimeoutError)
      throw new ErroLLM(`${p.nome} não respondeu dentro de ${timeoutMs / 1000} s.`, 504);
    if (e instanceof Anthropic.APIConnectionError)
      throw new ErroLLM(`Não foi possível falar com ${p.nome}. Confira a rede.`, 502);
    if (e instanceof Anthropic.APIError) throw erroPorStatus(p, e.status, e.error?.error?.message || e.message);
    throw e;
  }
}

function cabecalhosOpenAI(p) {
  const h = { 'content-type': 'application/json' };
  if (p.chaveValor) {
    if (p.cabecalhoChave === 'api-key') h['api-key'] = p.chaveValor;
    else h.authorization = `Bearer ${p.chaveValor}`;
  }
  return h;
}

const espera = (ms, signal) =>
  new Promise((ok, falha) => {
    if (signal.aborted) return falha(signal.reason);
    const t = setTimeout(ok, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        falha(signal.reason);
      },
      { once: true },
    );
  });

// Texto da resposta: alguns provedores devolvem uma lista de partes em vez de uma string.
function textoDe(conteudo) {
  if (typeof conteudo === 'string') return conteudo;
  if (!Array.isArray(conteudo)) return '';
  return conteudo.map((c) => (typeof c === 'string' ? c : c?.text || '')).join('');
}

async function chamarOpenAI(p, { model, system, user }, signal) {
  const { maxTokens, timeoutMs } = limites();
  const corpo = {
    model,
    [p.limite || 'max_tokens']: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  };
  const sinal = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  const semResposta = (e) => {
    if (signal.aborted) return e;
    if (e.name === 'TimeoutError') return new ErroLLM(`${p.nome} não respondeu dentro de ${timeoutMs / 1000} s.`, 504);
    if (e.cause?.code === 'ECONNREFUSED')
      return new ErroLLM(`${p.nome} recusou a conexão em ${p.base}. Confira se o servidor está ligado.`, 502);
    return new ErroLLM(`Não foi possível falar com ${p.nome} em ${p.base}. Confira a URL base.`, 502);
  };
  for (let tentativa = 0; ; tentativa++) {
    let r;
    try {
      r = await fetch(`${p.base}/chat/completions`, {
        method: 'POST',
        signal: sinal,
        headers: cabecalhosOpenAI(p),
        body: JSON.stringify(corpo),
      });
    } catch (e) {
      // Uma conexão derrubada no meio do caminho não pode encerrar uma execução longa.
      const passageira = !signal.aborted && e.name !== 'TimeoutError' && e.cause?.code !== 'ECONNREFUSED';
      if (!passageira || tentativa >= 2) throw semResposta(e);
      await espera(1000 * 2 ** tentativa, sinal).catch((erro) => {
        throw semResposta(erro);
      });
      continue;
    }
    if ((r.status === 429 || r.status >= 500) && tentativa < 2) {
      const pedido = Number(r.headers.get('retry-after')) * 1000;
      await espera(Math.min(pedido || 1000 * 2 ** tentativa, 15000), sinal).catch((e) => {
        throw semResposta(e);
      });
      continue;
    }
    if (!r.ok) {
      let detalhe = '';
      try {
        const j = await r.json();
        detalhe = j.error?.message || j.error || j.message || JSON.stringify(j);
      } catch {}
      throw erroPorStatus(p, r.status, typeof detalhe === 'string' ? detalhe : JSON.stringify(detalhe));
    }
    let j;
    try {
      j = await r.json();
    } catch (e) {
      if (signal.aborted || e.name === 'TimeoutError') throw semResposta(e);
      throw new ErroLLM(`${p.nome} devolveu algo que não é JSON. Confira a URL base.`, 502);
    }
    const escolha = j.choices?.[0];
    return {
      text: textoDe(escolha?.message?.content),
      tin: j.usage?.prompt_tokens,
      tout: j.usage?.completion_tokens,
      parada: escolha?.finish_reason,
    };
  }
}

export async function chamar({ provider, model, system, user }, signal) {
  const p = provedor(provider);
  if (!p) throw new ErroLLM(`Provedor desconhecido: ${provider}.`, 400);
  if (!p.configurado)
    throw new ErroLLM(`${p.nome} não está configurado. Preencha ${p.local ? `${p.prefixo}_BASE_URL` : p.chave} no .env.`, 400);
  if (!model) throw new ErroLLM(`Escolha um modelo de ${p.nome}.`, 400);
  const pedido = { model, system, user };
  const r = await (p.formato === 'anthropic' ? chamarAnthropic(p, pedido, signal) : chamarOpenAI(p, pedido, signal));
  if (!r.text.trim()) throw new ErroLLM(`${p.nome} devolveu uma resposta vazia (${r.parada || 'sem motivo informado'}).`, 502);
  return r;
}

async function modelosAoVivo(p) {
  const signal = AbortSignal.timeout(TEMPO_MODELOS_MS);
  if (p.formato === 'anthropic') {
    const ids = [];
    for await (const m of clienteAnthropic(p, TEMPO_MODELOS_MS).models.list({}, { signal })) ids.push(m.id);
    return ids;
  }
  const r = await fetch(`${p.base}/models`, { signal, headers: cabecalhosOpenAI(p) });
  if (!r.ok) throw erroPorStatus(p, r.status);
  const j = await r.json();
  const ids = (j.data || j.models || []).map((m) => String(m.id || m.name || '').replace(/^models\//, ''));
  return ids.filter((id) => id && !NAO_CHAT.test(id));
}

const cacheModelos = new Map();

async function descobrir(p, forcar) {
  const assinatura = `${p.base}|${p.chaveValor}`;
  const salvo = cacheModelos.get(p.id);
  if (!forcar && salvo?.assinatura === assinatura && Date.now() - salvo.em < CACHE_MODELOS_MS) return salvo;
  const novo = { assinatura, em: Date.now(), vivos: [], online: false, erro: '' };
  try {
    novo.vivos = await modelosAoVivo(p);
    novo.online = true;
  } catch (e) {
    novo.erro = mascarar(e.message, p.chaveValor).slice(0, 200);
  }
  cacheModelos.set(p.id, novo);
  return novo;
}

const mascaraChave = (k) => (k ? `••••${k.slice(-4)}` : '');

// O que o navegador pode saber: nunca inclui a chave, só o final dela.
export async function listarProvedores(forcar = false) {
  return Promise.all(
    provedores().map(async (p) => {
      const vivo = p.configurado ? await descobrir(p, forcar) : { vivos: [], online: false, erro: '' };
      const iniciais = p.modelosEnv.length ? p.modelosEnv : p.modelos;
      return {
        id: p.id,
        nome: p.nome,
        local: !!p.local,
        configurado: p.configurado,
        online: vivo.online,
        erro: vivo.erro,
        variavel: p.local ? `${p.prefixo}_BASE_URL` : p.chave,
        chave: mascaraChave(p.chaveValor),
        base: p.local ? p.base : '',
        // Com o provedor no ar vale a lista real: o catálogo fixo pode citar modelos que já saíram.
        modelos: [...new Set(vivo.online ? [...p.modelosEnv, ...vivo.vivos] : [...iniciais, ...vivo.vivos])],
        vivos: vivo.vivos,
      };
    }),
  );
}
