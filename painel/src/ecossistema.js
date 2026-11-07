// Lê do disco o pacote do ecossistema, no formato { "caminho/relativo.md": "conteúdo" }.
import fs from 'node:fs';
import path from 'node:path';

import yaml from 'js-yaml';
import { ECOSYSTEM_PATH, RAIZ, RAIZ_ECOSSISTEMAS } from './config.js';

const TEXTO = /\.(md|ya?ml|py|txt|json|csv)$/i;
const IGNORAR = new Set(['dist', 'node_modules', '.git', '__pycache__']);

export function lerPacote(raiz) {
  if (!fs.existsSync(path.join(raiz, 'ecosystem.yaml'))) {
    throw new Error(`Não encontrei ecosystem.yaml em ${raiz}. Confira a pasta escolhida ou ECOSSISTEMA_DIR no .env.`);
  }
  const arquivos = {};
  const visitar = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      if (item.name.startsWith('.') || IGNORAR.has(item.name)) continue;
      const cheio = path.join(dir, item.name);
      if (item.isDirectory()) visitar(cheio);
      else if (TEXTO.test(item.name)) {
        arquivos[path.relative(raiz, cheio).split(path.sep).join('/')] = fs.readFileSync(cheio, 'utf8');
      }
    }
  };
  visitar(raiz);
  return adaptarCatalogo(arquivos);
}

// Todos os diretórios na raiz do repositório, menos o do painel.
export function listarEcossistemas() {
  return fs
    .readdirSync(RAIZ_ECOSSISTEMAS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !IGNORAR.has(d.name) && d.name !== path.basename(RAIZ))
    .map((d) => d.name)
    .sort();
}

const CATALOGOS = [
  {
    chave: 'dominios',
    tipo: 'dominio',
    arquivo: '00-dominios/DOMINIOS.md',
    ids: (m) => [m.dominio_raiz, ...(m.dominios || []).map((d) => d.id)],
  },
  {
    chave: 'orquestradores',
    tipo: 'orquestrador',
    arquivo: '10-orquestradores/ORQUESTRADORES.md',
    ids: (m) => (m.dominios || []).map((d) => d.orquestrador),
  },
  { chave: 'multiagentes', tipo: 'multiagentes', arquivo: '20-multiagentes/MULTIAGENTES.md', ids: (m) => m.multiagentes },
  { chave: 'agentes', tipo: 'agente', arquivo: '30-agentes/AGENTES.md', ids: (m) => m.agentes },
  { chave: 'subagentes', tipo: 'subagente', arquivo: '40-subagentes/SUBAGENTES.md', ids: (m) => m.subagentes },
  { chave: 'workflows', tipo: 'workflow', arquivo: '50-workflows/WORKFLOWS.md', ids: (m) => m.workflows },
  { chave: 'skills', tipo: 'skill', arquivo: '60-skills/SKILLS.md', ids: (m) => m.skills },
  { chave: 'rags', tipo: 'rag', arquivo: '70-rag/RAGS.md', ids: (m) => m.rags },
];

const celulas = (linha) =>
  linha
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

function tabela(md = '') {
  const linhas = md.split('\n').filter((l) => l.startsWith('|'));
  const cabecalho = celulas(linhas[0] || '');
  return new Map(
    linhas.slice(2).map((l) => {
      const c = celulas(l);
      return [c[0], cabecalho.slice(1).map((h, i) => [h, c[i + 1] || ''])];
    }),
  );
}

const citados = (texto = '') => texto.match(/\b(?:dom|orq|ma|wf|ag|sa|sk|rag)\.[a-z0-9-]+/g) || [];
const secao = (md, titulo) => new RegExp(`^## ${titulo}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm').exec(md)?.[1] || '';
const campo = (md, rotulo) => new RegExp(`^- ${rotulo}:(.*)$`, 'm').exec(md)?.[1] || '';

// Em cada arquivo, as ligações ficam nos campos que citam ids: o orquestrador diz seu domínio,
// agentes e rotas; a formação diz coordenador e membros; o agente diz suas dependências.
function ligarRecursos(recursos, arquivos, raiz) {
  const porId = new Map(recursos.map((r) => [r.id, r]));
  const ligar = (de, ...para) => {
    const origem = porId.get(de);
    if (!origem) return;
    for (const id of para) if (id !== de && porId.has(id) && !origem.usa.includes(id)) origem.usa.push(id);
  };
  for (const r of recursos) {
    const md = arquivos[r.arquivo] || '';
    if (r.tipo === 'dominio') ligar(raiz, r.id);
    if (r.tipo === 'orquestrador') {
      const vinculo = secao(md, 'Vinculação');
      ligar(citados(campo(vinculo, 'Domínio'))[0], r.id);
      ligar(r.id, ...citados(campo(vinculo, 'Agentes elegíveis')), ...citados(campo(vinculo, 'Rotas elegíveis')));
    }
    if (r.tipo === 'multiagentes') {
      ligar(citados(campo(md, 'Coordenador'))[0], r.id);
      ligar(r.id, ...citados(campo(md, 'Membros')));
    }
    if (r.tipo === 'agente') ligar(r.id, ...citados(secao(md, 'Dependências autorizáveis')));
  }
}

// Pacote em formato de catálogo: a lista de ids no manifesto e os detalhes em tabelas.
// Vira um arquivo por recurso. As ligações são só as declaradas: nada é deduzido da descrição.
export function adaptarCatalogo(arquivos) {
  let man;
  try {
    man = yaml.load(arquivos['ecosystem.yaml']) || {};
  } catch {
    return arquivos;
  }
  if (Array.isArray(man.recursos) || !man.dominio_raiz) return arquivos;

  // Alguns pacotes declaram cada tipo em uma lista de registros { id, arquivo }.
  // Nesse formato os arquivos já são completos: só unificamos as listas no manifesto
  // que o painel consome, sem substituir o conteúdo real por páginas sintetizadas.
  const estruturado = CATALOGOS.some(({ chave }) =>
    (man[chave] || []).some((item) => item && typeof item === 'object' && item.id && item.arquivo),
  );
  if (estruturado) {
    const recursos = CATALOGOS.flatMap(({ chave, tipo }) =>
      (man[chave] || [])
        .filter((item) => item && typeof item === 'object' && item.id && item.arquivo)
        .map((item) => ({ ...item, tipo: item.tipo || tipo, usa: Array.isArray(item.usa) ? item.usa : [] })),
    );
    ligarRecursos(recursos, arquivos, man.dominio_raiz);
    const colecoes = new Set(CATALOGOS.map(({ chave }) => chave));
    const resto = Object.fromEntries(Object.entries(man).filter(([chave]) => chave !== 'dominio_raiz' && !colecoes.has(chave)));
    return { ...arquivos, 'ecosystem.yaml': yaml.dump({ ...resto, raiz: man.dominio_raiz, recursos }) };
  }

  const itens = CATALOGOS.flatMap(({ tipo, arquivo, ids }) => {
    const detalhes = tabela(arquivos[arquivo]);
    return [...new Set(ids(man) || [])].map((id) => ({ id, tipo, pasta: arquivo.split('/')[0], campos: detalhes.get(id) || [] }));
  });
  const existentes = new Set(itens.map((i) => i.id));
  const orquestradorDe = new Map((man.dominios || []).map((d) => [d.id, d.orquestrador]));
  const usaDe = (i) => {
    if (i.id === man.dominio_raiz) return (man.dominios || []).map((d) => d.id);
    if (orquestradorDe.has(i.id)) return [orquestradorDe.get(i.id)];
    const citados = i.campos.flatMap(([, valor]) => valor.match(/\b[a-z]+\.[a-z0-9-]+/g) || []);
    return [...new Set(citados)].filter((u) => u !== i.id && existentes.has(u));
  };
  const saida = { ...arquivos };
  const recursos = itens.map((i) => {
    const titulo = i.id.split('.')[1].replace(/-/g, ' ');
    const nome = titulo[0].toUpperCase() + titulo.slice(1);
    const usa = usaDe(i);
    const corpo = i.campos.map(([campo, valor]) => `## ${campo}\n\n${valor}\n`).join('\n');
    const arquivo = `${i.pasta}/${i.id}.md`;
    saida[arquivo] = `---\n${yaml.dump({ id: i.id, nome, tipo: i.tipo, usa })}---\n# ${nome}\n\n${corpo}`;
    return { id: i.id, arquivo, usa };
  });
  const { dominio_raiz: raiz, dominios, multiagentes, agentes, subagentes, workflows, skills, rags, ...resto } = man;
  saida['ecosystem.yaml'] = yaml.dump({ ...resto, raiz, recursos });
  return saida;
}

const lerRegistro = () => {
  try {
    return JSON.parse(fs.readFileSync(ECOSYSTEM_PATH, 'utf8'));
  } catch {
    return {};
  }
};

// Uma entrada por conta, para o teste de um provedor não apagar a leitura de outro.
// A entrada só é regravada se mudou, para lido_em marcar a leitura que valeu.
export function gravarLeitura(provedor, leitura) {
  const contas = lerRegistro().contas || {};
  const { lido_em: _, ...anterior } = contas[provedor] || {};
  if (JSON.stringify(anterior) === JSON.stringify(leitura)) return false;
  contas[provedor] = { ...leitura, lido_em: new Date().toISOString() };
  fs.writeFileSync(ECOSYSTEM_PATH, `${JSON.stringify({ contas }, null, 2)}\n`);
  return true;
}
