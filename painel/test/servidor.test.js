// Testa o servidor de verdade: sobe um processo e fala com ele por HTTP.
// Os provedores são substituídos por um servidor local falso, então nada aqui gasta chamadas.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { adaptarCatalogo } from '../src/ecossistema.js';

// Um ecossistema real do repositório, descoberto aqui para o teste não depender do nome da pasta.
const RAIZ_REPO = path.resolve(import.meta.dirname, '../..');
const ECO_REAL = fs.readdirSync(RAIZ_REPO).find((d) => fs.existsSync(path.join(RAIZ_REPO, d, 'ecosystem.yaml')));
const CHAVE = 'chave-secreta-de-teste-1234';
const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-teste-'));
const envPath = path.join(pasta, '.env');

// Devolve uma porta livre no momento da chamada.
const portaLivre = () =>
  new Promise((ok) => {
    const s = http.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => ok(port));
    });
  });

function subir(porta) {
  const filho = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORTA: String(porta), PAINEL_ENV: envPath },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let saida = '';
  filho.stdout.on('data', (d) => (saida += d));
  filho.stderr.on('data', (d) => (saida += d));
  return { filho, saida: () => saida };
}

async function esperar(condicao, ms = 5000) {
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    if (await condicao()) return;
    await new Promise((ok) => setTimeout(ok, 40));
  }
  throw new Error('Tempo esgotado esperando o servidor.');
}

describe('servidor do painel', () => {
  let falso, base, processo;
  // O que o provedor falso responde, trocado a cada teste.
  let responder = () => ({ status: 200, corpo: {} });
  let pedidos = [];
  // O que a conta do provedor falso tem publicado.
  let conta = { arquivos: [], bases: [] };

  const chat = (corpo) =>
    fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'custom', model: 'm', system: 's', user: 'u', ...corpo }),
    });
  const resposta = (texto, extra = {}) => ({
    status: 200,
    corpo: { choices: [{ message: { content: texto }, finish_reason: 'stop' }], usage: { prompt_tokens: 3, completion_tokens: 2 }, ...extra },
  });

  before(async () => {
    falso = http.createServer((req, res) => {
      let corpo = '';
      req.on('data', (d) => (corpo += d));
      req.on('end', () => {
        if (req.url.endsWith('/models')) return res.end(JSON.stringify({ data: [{ id: 'm' }, { id: 'text-embedding-x' }] }));
        if (/\/(files|vector_stores)\?/.test(req.url)) {
          res.statusCode = conta.falhar ? 500 : 200;
          return res.end(JSON.stringify({ data: req.url.includes('/files') ? conta.arquivos : conta.bases }));
        }
        pedidos.push({ corpo: JSON.parse(corpo), auth: req.headers.authorization });
        const r = responder(pedidos.length);
        if (r.derrubar) return req.socket.destroy();
        res.statusCode = r.status;
        res.end(typeof r.corpo === 'string' ? r.corpo : JSON.stringify(r.corpo));
      });
    });
    await new Promise((ok) => falso.listen(0, '127.0.0.1', ok));
    fs.writeFileSync(
      envPath,
      `CUSTOM_BASE_URL=http://127.0.0.1:${falso.address().port}/v1\nCUSTOM_API_KEY=${CHAVE}\nLLM_MAX_TOKENS=100\nLLM_TIMEOUT_MS=2000\nECOSSISTEMA_DIR=../${ECO_REAL}\n`,
    );
    const porta = await portaLivre();
    base = `http://127.0.0.1:${porta}`;
    processo = subir(porta);
    await esperar(() => processo.saida().includes('Ctrl+C'));
  });

  after(() => {
    processo?.filho.kill();
    falso?.close();
    fs.rmSync(pasta, { recursive: true, force: true });
  });

  it('entrega a interface, os vendors e o ecossistema', async () => {
    for (const rota of ['/', '/js/motor.js', '/vendor/js-yaml.min.js', '/vendor/jszip.min.js']) {
      assert.equal((await fetch(base + rota)).status, 200, rota);
    }
    const { arquivos } = await (await fetch(`${base}/api/ecossistema`)).json();
    assert.ok(arquivos['ecosystem.yaml']);
  });

  it('não expõe .env nem o código do servidor', async () => {
    for (const rota of ['/.env', '/server.js', '/src/config.js']) {
      assert.equal((await fetch(base + rota)).status, 404, rota);
    }
  });

  it('nunca manda a chave ao navegador', async () => {
    const texto = await (await fetch(`${base}/api/provedores`)).text();
    assert.ok(!texto.includes(CHAVE));
    const custom = JSON.parse(texto).provedores.find((p) => p.id === 'custom');
    assert.equal(custom.configurado, true);
    assert.equal(custom.chave, '••••1234');
    assert.deepEqual(custom.modelos, ['m'], 'filtra modelos que não são de chat');
    assert.deepEqual(custom.vivos, ['m'], 'informa o que o provedor confirmou');
  });

  it('só aceita a própria página', async () => {
    const pedir = (headers) =>
      new Promise((ok) => {
        const u = new URL(`${base}/api/provedores`);
        http.get({ host: u.hostname, port: u.port, path: u.pathname, headers }, (r) => {
          r.resume();
          ok(r.statusCode);
        });
      });
    const host = new URL(base).host;
    assert.equal(await pedir({ Host: 'evil.com' }), 403, 'DNS rebinding');
    assert.equal(await pedir({ Host: host, Origin: 'https://evil.com' }), 403, 'outro site');
    assert.equal(await pedir({ Host: host, Origin: 'http://localhost:9' }), 403, 'outra porta local');
    assert.equal(await pedir({ Host: host, Origin: 'null' }), 403, 'origem opaca');
    assert.equal(await pedir({ Host: host, Origin: `http://${host}` }), 200, 'a própria página');
  });

  it('recusa pedidos inválidos com mensagem clara', async () => {
    assert.equal((await chat({ system: undefined })).status, 400);
    assert.match((await (await chat({ provider: 'x' })).json()).error, /Provedor desconhecido/);
    assert.match((await (await chat({ provider: 'openai' })).json()).error, /não está configurado/);
    assert.match((await (await chat({ model: '' })).json()).error, /Escolha um modelo/);
  });

  it('chama o provedor e devolve texto e tokens', async () => {
    pedidos = [];
    responder = () => resposta('olá');
    const j = await (await chat()).json();
    assert.equal(j.text, 'olá');
    assert.equal(j.tin, 3);
    assert.equal(j.tout, 2);
    assert.equal(pedidos[0].auth, `Bearer ${CHAVE}`);
    assert.equal(pedidos[0].corpo.max_tokens, 100);
  });

  it('aceita conteúdo em lista de partes', async () => {
    responder = () => resposta([{ type: 'text', text: 'a' }, { type: 'text', text: 'b' }]);
    assert.equal((await (await chat()).json()).text, 'ab');
  });

  it('repete em erro temporário', async () => {
    pedidos = [];
    responder = (n) => (n === 1 ? { status: 503, corpo: {} } : resposta('voltou'));
    assert.equal((await (await chat()).json()).text, 'voltou');
    assert.equal(pedidos.length, 2);
  });

  it('trata resposta vazia e resposta que não é JSON', async () => {
    responder = () => resposta('   ');
    let r = await chat();
    assert.equal(r.status, 502);
    assert.match((await r.json()).error, /resposta vazia/);
    responder = () => ({ status: 200, corpo: '<html>proxy</html>' });
    r = await chat();
    assert.equal(r.status, 502);
    assert.match((await r.json()).error, /não é JSON/);
  });

  it('repete quando a conexão cai no meio do caminho', async () => {
    pedidos = [];
    responder = (n) => (n === 1 ? { derrubar: true } : resposta('reconectou'));
    assert.equal((await (await chat()).json()).text, 'reconectou');
    assert.equal(pedidos.length, 2);
  });

  it('diz que o servidor está desligado, sem culpar a URL', async () => {
    const original = fs.readFileSync(envPath, 'utf8');
    fs.writeFileSync(envPath, original.replace(/CUSTOM_BASE_URL=.*/, `CUSTOM_BASE_URL=http://127.0.0.1:${await portaLivre()}/v1`));
    try {
      const r = await chat();
      assert.equal(r.status, 502);
      assert.match((await r.json()).error, /recusou a conexão.*ligado/);
    } finally {
      fs.writeFileSync(envPath, original);
    }
  });

  it('não vaza a chave em mensagens de erro', async () => {
    responder = () => ({ status: 401, corpo: { error: { message: `chave inválida: ${CHAVE}` } } });
    const { error } = await (await chat()).json();
    assert.match(error, /recusou a chave/);
    assert.ok(!error.includes(CHAVE));
  });

  describe('leitura da conta', () => {
    const arquivo = path.join(pasta, '.ecosystem');
    const ler = (provider = 'openai') =>
      fetch(`${base}/api/ecossistema/leitura`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider, model: 'm' }),
      }).then(async (r) => ({ status: r.status, j: await r.json() }));
    const registro = () => JSON.parse(fs.readFileSync(arquivo, 'utf8')).contas;
    let envOriginal;

    before(() => {
      envOriginal = fs.readFileSync(envPath, 'utf8');
      const url = `http://127.0.0.1:${falso.address().port}/v1`;
      fs.writeFileSync(envPath, `${envOriginal}OPENAI_API_KEY=${CHAVE}\nOPENAI_BASE_URL=${url}\n`);
    });
    after(() => fs.writeFileSync(envPath, envOriginal));

    it('conta vazia não chama o modelo', async () => {
      conta = { arquivos: [], bases: [{ id: 'vs_1', name: null, file_counts: { total: 0 } }] };
      pedidos = [];
      const { j } = await ler();
      assert.equal(j.total, 0);
      assert.equal(j.inventario, 0);
      assert.equal(pedidos.length, 0, 'sem inventário não pode haver chamada');
      assert.equal(registro().openai.total, 0);
    });

    it('o modelo classifica e o painel descarta o que não existe na conta', async () => {
      conta = {
        bases: [],
        arquivos: [
          { id: 'file-1', filename: 'dom.vendas.md' },
          { id: 'file-2', filename: 'ag.Prospecção.md' },
          { id: 'file-3', filename: 'foto.png' },
        ],
      };
      pedidos = [];
      responder = () =>
        resposta(
          'Segue: ' +
            JSON.stringify({
              nome: 'Vendas',
              elementos: [
                { ref: 'file-1', tipo: 'dominio', usa: ['file-2', 'nao-existe'] },
                { ref: 'file-2', tipo: 'agente' },
                { ref: 'inventado', tipo: 'agente' },
              ],
            }),
        );
      const { j } = await ler();
      assert.equal(pedidos.length, 1);
      assert.deepEqual(j.contagem, { dominio: 1, agente: 1 });
      assert.deepEqual(j.inventados, ['inventado']);
      assert.deepEqual(j.fora, ['foto.png']);
      assert.equal(j.tipos[0].elementos[0].id, 'dom.vendas');
      assert.deepEqual(j.tipos[0].elementos[0].usa, ['ag.prospeccao']);
      assert.equal(j.gravado, true);
      assert.equal(registro().openai.nome, 'Vendas');

      const lidoEm = registro().openai.lido_em;
      assert.equal((await ler()).j.gravado, false, 'só regrava quando muda');
      assert.equal(registro().openai.lido_em, lidoEm);
    });

    it('avisa quando a lista da conta falhou, em vez de dizer que está vazia', async () => {
      conta = { falhar: true };
      const { j } = await ler();
      assert.equal(j.total, 0);
      assert.ok(j.avisos.some((a) => a.includes('erro 500')));
    });

    it('resposta fora de JSON vira erro claro', async () => {
      conta = { arquivos: [{ id: 'file-1', filename: 'dom.a.md' }], bases: [] };
      responder = () => resposta('não sei');
      const { status, j } = await ler();
      assert.equal(status, 502);
      assert.match(j.error, /JSON/);
    });

    it('provedor que só expõe modelos não grava nada', async () => {
      const antes = fs.readFileSync(arquivo, 'utf8');
      const { j } = await ler('custom');
      assert.equal(j.suportado, false);
      assert.equal(fs.readFileSync(arquivo, 'utf8'), antes);
    });
  });

  it('lista os diretórios da raiz, menos o painel, e só abre os da lista', async () => {
    const { diretorios } = await (await fetch(`${base}/api/ecossistemas`)).json();
    assert.ok(diretorios.includes(ECO_REAL));
    assert.ok(!diretorios.includes('painel'));
    assert.ok(!diretorios.some((d) => d.startsWith('.')));
    const abrir = (dir) => fetch(`${base}/api/ecossistema?dir=${encodeURIComponent(dir)}`);
    assert.equal((await abrir(ECO_REAL)).status, 200);
    assert.equal((await abrir('ecossistema-empresa')).status, 200);
    for (const dir of ['painel', '..', '../painel', 'nao-existe']) assert.equal((await abrir(dir)).status, 404, dir);
    assert.equal((await fetch(`${base}/api/ecossistema?dir=a&dir=b`)).status, 404, 'parâmetro repetido');
  });

  describe('gravação da pasta escolhida no .env', () => {
    const selecionar = (dir) =>
      fetch(`${base}/api/ecossistema/selecao`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ dir }),
      });
    let envOriginal;

    before(() => {
      envOriginal = fs.readFileSync(envPath, 'utf8');
    });
    after(() => fs.writeFileSync(envPath, envOriginal));

    it('troca só a linha do ECOSSISTEMA_DIR e preserva o resto do arquivo', async () => {
      const semPasta = envOriginal.replace(/^ECOSSISTEMA_DIR=.*\n/m, '');
      const antes = `# comentário\n${semPasta}# ECOSSISTEMA_DIR=../comentado\nECOSSISTEMA_DIR=../outro\nPORTA=1\n`;
      fs.writeFileSync(envPath, antes);
      fs.chmodSync(envPath, 0o600);
      assert.deepEqual(await (await selecionar(ECO_REAL)).json(), { gravado: true });
      assert.equal(fs.readFileSync(envPath, 'utf8'), antes.replace('ECOSSISTEMA_DIR=../outro', `ECOSSISTEMA_DIR=../${ECO_REAL}`));
      assert.equal(fs.statSync(envPath).mode & 0o777, 0o600, 'mantém as permissões');
      assert.ok(!fs.existsSync(`${envPath}.tmp`), 'não deixa temporário');
      const { padrao } = await (await fetch(`${base}/api/ecossistemas`)).json();
      assert.equal(padrao, ECO_REAL, 'o servidor já lê o novo valor');
    });

    it('não reescreve o arquivo sem mudança e acrescenta a linha que falta', async () => {
      assert.deepEqual(await (await selecionar(ECO_REAL)).json(), { gravado: false });
      fs.writeFileSync(envPath, 'PORTA=1');
      await selecionar(ECO_REAL);
      assert.equal(fs.readFileSync(envPath, 'utf8'), `PORTA=1\nECOSSISTEMA_DIR=../${ECO_REAL}\n`);
    });

    it('recusa pasta fora da lista sem tocar no .env', async () => {
      const antes = fs.readFileSync(envPath, 'utf8');
      for (const dir of ['painel', '..', '../../etc', 'x\nCHAVE=1', 7]) assert.equal((await selecionar(dir)).status, 404, String(dir));
      assert.equal(fs.readFileSync(envPath, 'utf8'), antes);
    });
  });

  it('lê as ligações que os arquivos do pacote declaram por id', async () => {
    const yaml = await import('js-yaml');
    const registro = (id, pasta) => ({ id, arquivo: `${pasta}/${id}.md` });
    const saida = adaptarCatalogo({
      'ecosystem.yaml': yaml.dump({
        dominio_raiz: 'dom.raiz',
        dominios: [registro('dom.raiz', 'd'), registro('dom.vendas', 'd')],
        orquestradores: [registro('orq.vendas', 'o')],
        multiagentes: [registro('ma.conselho', 'm')],
        agentes: [registro('ag.a', 'a'), registro('ag.b', 'a')],
        workflows: [registro('wf.w', 'w')],
        skills: [registro('sk.s', 's')],
      }),
      'o/orq.vendas.md':
        '## Vinculação\n\n- Domínio: `dom.vendas`\n- Rotas elegíveis: wf.w; wf.nao-existe\n- Agentes elegíveis: ag.a; ag.b\n- Escalonamento humano: sk.s\n\n## Outra\n\nag.nao-entra\n',
      'm/ma.conselho.md': '## Formação\n\n- Coordenador: `orq.vendas`\n- Membros: ag.a; ag.b\n',
      'a/ag.a.md': '## Dependências autorizáveis\n\nsk.s; ag.a. Só se permitidas.\n\n## Procedimento\n\nag.b\n',
    });
    const usa = Object.fromEntries(yaml.load(saida['ecosystem.yaml']).recursos.map((r) => [r.id, r.usa]));
    assert.deepEqual(usa, {
      'dom.raiz': ['dom.vendas'],
      'dom.vendas': ['orq.vendas'],
      'orq.vendas': ['ag.a', 'ag.b', 'wf.w', 'ma.conselho'],
      'ma.conselho': ['ag.a', 'ag.b'],
      'ag.a': ['sk.s'],
      'ag.b': [],
      'wf.w': [],
      'sk.s': [],
    });
  });

  it('adapta um pacote em formato de catálogo usando só as ligações declaradas', async () => {
    const yaml = await import('js-yaml');
    const saida = adaptarCatalogo({
      'ecosystem.yaml': yaml.dump({
        nome: 'Cat',
        dominio_raiz: 'dom.raiz',
        dominios: [{ id: 'dom.vendas', orquestrador: 'orq.vendas' }],
        agentes: ['ag.a'],
        skills: ['sk.b'],
        acoes_ferramentas: ['act.c'],
      }),
      '30-agentes/AGENTES.md': '| ID | Missão | Dependências sugeridas |\n|---|---|---|\n| ag.a | fazer | sk.b, rag.fora |\n',
    });
    const man = yaml.load(saida['ecosystem.yaml']);
    const usa = Object.fromEntries(man.recursos.map((r) => [r.id, r.usa]));
    assert.equal(man.raiz, 'dom.raiz');
    assert.deepEqual(usa, { 'dom.raiz': ['dom.vendas'], 'dom.vendas': ['orq.vendas'], 'orq.vendas': [], 'ag.a': ['sk.b'], 'sk.b': [] });
    assert.match(saida['30-agentes/ag.a.md'], /## Missão\n\nfazer/);

    const pronto = { 'ecosystem.yaml': yaml.dump({ raiz: 'dom.a', recursos: [] }) };
    assert.equal(adaptarCatalogo(pronto), pronto, 'pacote no formato normal não muda');
  });

  it('adapta catálogo estruturado sem substituir os arquivos dos recursos', async () => {
    const yaml = await import('js-yaml');
    const dominio = '---\nid: dom.raiz\ntipo: dominio\n---\n# Domínio real\n';
    const agente = '---\nid: ag.a\ntipo: agente\n---\n# Agente real\n';
    const saida = adaptarCatalogo({
      'ecosystem.yaml': yaml.dump({
        nome: 'Estruturado',
        dominio_raiz: 'dom.raiz',
        dominios: [{ id: 'dom.raiz', arquivo: '00-dominios/dom.raiz.md', status: 'PENDENTE' }],
        agentes: [{ id: 'ag.a', arquivo: '30-agentes/ag.a.md', status: 'PENDENTE' }],
      }),
      '00-dominios/dom.raiz.md': dominio,
      '30-agentes/ag.a.md': agente,
    });
    const man = yaml.load(saida['ecosystem.yaml']);

    assert.equal(man.raiz, 'dom.raiz');
    assert.deepEqual(
      man.recursos.map(({ id, tipo, arquivo, usa }) => ({ id, tipo, arquivo, usa })),
      [
        { id: 'dom.raiz', tipo: 'dominio', arquivo: '00-dominios/dom.raiz.md', usa: [] },
        { id: 'ag.a', tipo: 'agente', arquivo: '30-agentes/ag.a.md', usa: [] },
      ],
    );
    assert.equal(saida['00-dominios/dom.raiz.md'], dominio);
    assert.equal(saida['30-agentes/ag.a.md'], agente);
  });

  it('anuncia só a porta em que realmente subiu', async () => {
    const porta = await portaLivre();
    const ocupante = http.createServer();
    await new Promise((ok) => ocupante.listen(porta, '127.0.0.1', ok));
    const p = subir(porta);
    try {
      await esperar(() => p.saida().includes('Ctrl+C'));
      assert.ok(p.saida().includes(`ocupada, tentando ${porta + 1}`));
      assert.ok(!p.saida().includes(`http://localhost:${porta}\n`), 'não pode anunciar a porta ocupada');
    } finally {
      p.filho.kill();
      ocupante.close();
    }
  });
});
