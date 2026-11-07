# Painel da Fábrica de IA

Console local para explorar um ecossistema de prompts e ver as chamadas acontecendo. Você começa pelo topo da hierarquia, expande só o que quer ver e acompanha cada envelope passando de um recurso para outro, com o modelo que quiser em cada nível.

## Como iniciar

Precisa do Node.js 20 ou mais novo.

| Sistema | Iniciar | Só verificar, sem instalar nada |
| --- | --- | --- |
| macOS e Linux | `./start.sh` | `./start.sh --check` |
| Windows | `start.bat` | `start.bat --check` |

O script mostra se faltam módulos do Node, pergunta antes de instalar, cria o `.env` na primeira vez e abre o navegador. Use `--install` para reinstalar os módulos.

Sem nenhuma chave o painel funciona em **Simulação**: mostra o fluxo completo, sem custo.

## Conectar os modelos

Tudo fica no `.env`, que só existe na sua máquina. As chaves não vão ao navegador: é o servidor local que chama cada provedor. Depois de editar o arquivo, clique em **Recarregar .env** na aba Conexão; não precisa reiniciar.

| Provedor | Variável |
| --- | --- |
| Anthropic, OpenAI, Gemini, Mistral, Groq, DeepSeek, xAI, OpenRouter | `<PROVEDOR>_API_KEY` |
| Ollama | `OLLAMA_BASE_URL` |
| Qualquer servidor compatível com a API da OpenAI | `CUSTOM_BASE_URL` |

O modelo de cada nível vem do mais específico para o mais geral:

1. O modelo escolhido para o recurso, no Inspetor
2. O modelo escolhido para o nível, na aba Conexão
3. `MODELO_<NÍVEL>` no `.env`
4. `MODELO_PADRAO` no `.env`
5. O primeiro modelo ativado
6. Simulação

**Conectado não significa em uso.** A aba Conexão mostra todos os modelos, com o status de cada um, e cada modelo tem um interruptor próprio:

| Status | Significado |
| --- | --- |
| Conectado | O provedor confirmou o modelo |
| Não listado | O modelo está no `.env`, mas o provedor não o listou |
| Sem resposta | O provedor configurado não respondeu |
| Sem chave ou Sem URL | Falta configurar o provedor no `.env` |

Cada provedor é uma caixa fechada: um clique abre a lista de modelos, outro fecha. A bolinha mostra o estado da conexão:

| Bolinha | Significado |
| --- | --- |
| Verde claro, piscando | Tem chave e está conectado |
| Amarelo claro | Tem chave, mas não conectou ou foi desligado |
| Vermelho claro | Não tem chave e não está habilitado |

Ao lado de **Testar**, o interruptor desliga a conexão mesmo com a chave no `.env`: nenhum modelo daquele provedor atende às chamadas até ele ser religado. A escolha fica no navegador, como a dos modelos.

Só modelos ativados aparecem nas listas e atendem às chamadas, então preencher uma chave não gera gasto sozinho. Os modelos citados em `MODELO_*` já vêm ativados, e dá para desligá-los pela aba sem alterar o `.env`. Quem ainda não tem chave vê os modelos conhecidos do provedor; Gemini, Groq e xAI só mostram a lista depois de conectados.

Para usar um único modelo em tudo, ative-o e escolha em **Conexão → Todos os níveis**.

## O que dá para fazer

- **Conversar:** a aba Prompt funciona como um chat, com o histórico em cima e o prompt sempre embaixo. Enter envia e Shift+Enter quebra a linha. Cada mensagem segue a conversa, inclusive para responder a uma pergunta do sistema: o modelo recebe os últimos 3 turnos, resumidos, e **Nova conversa** limpa esse histórico. Os portões dos workflows esperam sua aprovação. Para começar em um recurso específico, use **Executar a partir daqui**, no Inspetor.
- **Receber a entrega:** o orquestrador consolida o que os agentes devolveram no prompt final, e o resultado aparece no chat. **Baixar .md** salva a entrega com o pedido, as fontes, o checklist e a entrega de cada agente. Se a execução parar antes do fim, o que ficou pronto aparece como **Entrega parcial**. O rodapé do resultado confere quantos agentes foram acionados, quantas chamadas foram ao LLM e avisa se algum ficou sem resposta ou rodou em Simulação.
- **Ver a execução:** o mapa e a Hierarquia partem só da raiz e mostram os elementos que o roteamento e os planos escolherem para aquela demanda. **Exibir → Expandir tudo** volta a mostrar a hierarquia inteira.
- **Ler um mapa grande:** a partir de 12 recursos à vista, passar o mouse em um nó destaca só as ligações dele, e as consultas a skills e RAG ficam ocultas até serem pedidas em **Exibir → Mostrar todas as consultas**. De longe, os nós mostram só o nome. O título aparece sempre completo: a altura de cada caixa acompanha o número de linhas.
- **Saber quem responde:** acima do prompt aparece o que será usado, Simulação ou modelo, e se isso gera custo. A troca feita ali vale para todos os níveis. O nome do ecossistema, no topo, abre a lista para trocar de pasta.
- **Validação:** erro é o que impede a execução, como ligação inexistente, arquivo ausente, raiz inválida ou recurso solto. Seção com outro nome e chamada fora da matriz são avisos, porque cada pacote tem vocabulário próprio. A lista fica recolhida e agrupada; clique em um item para abrir o recurso.
- **Acompanhar as entregas:** a aba **Entregáveis** lista o que cada execução produziu, por versão, e a faixa acima da linha do tempo mostra interações, revisões, tempo, tokens, contexto e controle de qualidade. A nota de qualidade vem do checklist do orquestrador; sem checklist, ela fica em branco.
- **Gerar ecossistema** (menu Arquivo): a Fábrica desenha a estrutura e escreve o arquivo de cada recurso.
- **Evoluir ecossistema** (menu Arquivo): pede uma mudança no ecossistema aberto. O botão **Desfazer** volta à versão anterior.
- **Demonstração:** roda um exemplo completo em Simulação, com a árvore recolhida, para ver o ecossistema se abrindo.
- **Ajustar a tela:** arraste as divisórias entre os painéis, ou use as setas com a divisória em foco. Clique duplo restaura o tamanho. Os botões na barra do mapa mostram ou recolhem Hierarquia, Telemetria e o painel direito, e **Só o mapa** recolhe os três. O tamanho e os painéis recolhidos ficam salvos no navegador. Um portão de aprovação reabre o painel direito sozinho. Em janelas com até 1.240 px as divisórias somem, porque os painéis ficam empilhados.
- **Passo a passo:** pausa antes de cada envelope e de cada chamada. Avance com o botão ou com a barra de espaço.

Clique em qualquer barra da linha do tempo para ver o que foi enviado ao modelo e o que voltou.

## Leitura do ecossistema

Ao passar em **Testar** ou **Testar todos**, o painel lê o ecossistema publicado na conta do provedor, em três passos:

1. O painel lista o que existe na conta. Anthropic: skills próprias, agentes e arquivos. OpenAI: vector stores e arquivos. Gemini: arquivos e contextos em cache.
2. O modelo testado classifica essa lista em domínios, orquestradores, agentes, workflows e os demais tipos. Isso gasta tokens. Com a conta vazia o modelo não é chamado, porque só poderia inventar.
3. O painel confere a resposta contra a lista e descarta o que não existe na conta.

O resultado aparece na aba Conexão, atualiza o grafo e a legenda, que mostra a quantidade entre parênteses, como `🤖 Agente (5)`, e fica em `.ecosystem`, ao lado do `.env`, com uma entrada por conta. Só a estrutura é carregada: o conteúdo de cada recurso continua na conta. Um ecossistema alterado na tela ou em execução não é substituído.

**Projetos do claude.ai e GPTs não são acessíveis pela chave de API.** Para trazê-los, exporte os arquivos e use **Arquivo → Importar pacote**.

Sem nada publicado, o painel mostra o ecossistema local escolhido, e a aba Conexão avisa isso.

## Escolher o ecossistema local

O campo **Ecossistema**, na aba Conexão, lista todos os diretórios ao lado do `painel/`, na raiz do repositório. Escolha um deles e clique em **Carregar**: o painel busca os dados da pasta, aplica à tela e grava a escolha em `ECOSSISTEMA_DIR`, no `.env`, para abrir com ela da próxima vez. Só essa linha do `.env` muda, e nada é gravado se a pasta não abrir. Clicar de novo na mesma pasta relê os arquivos. Se o ecossistema aberto tiver alterações, o painel pede confirmação antes.

Pacotes que listam os recursos por tipo no manifesto, como o `ecossistema-empresa`, também abrem. As ligações vêm do que cada arquivo declara por id: `Vinculação` no orquestrador, `Coordenador` e `Membros` na formação, `Dependências autorizáveis` no agente. A validação aceita os nomes de seção equivalentes, como `Escopo` no lugar de `Fronteira`. Um workflow sem executor declarado responde pelas próprias etapas e para no seu gate. Ações e ferramentas não têm tipo no painel e não entram no grafo.

## O que você precisa saber

- **As edições ficam na memória da página.** "Salvar arquivo" não grava em disco: use **Arquivo → Exportar pacote .zip** para guardar. O navegador avisa antes de fechar uma página com trabalho não exportado.
- **Cada recurso acionado é uma chamada cobrada pelo provedor.** O "Limite de chamadas", em Opções de execução, na aba Conexão, interrompe a execução ao ser atingido.
- **Modelos locais podem ser lentos.** Se as chamadas passarem de 5 minutos, aumente `LLM_TIMEOUT_MS`. O Ollama trabalha com contexto de 4.096 tokens por padrão, e prompts maiores são cortados; ajuste `OLLAMA_CONTEXT_LENGTH` no ambiente dele para workflows grandes.
- O painel só atende em `127.0.0.1` e só aceita pedidos da própria página.

## Desenvolvimento

```
npm test            testa o servidor com um provedor falso, sem gastar chamadas
npm run verificar   mostra se o ambiente está pronto
```

| Caminho | Conteúdo |
| --- | --- |
| `server.js` | Servidor local e rotas da API |
| `src/config.js` | Leitura do `.env` e catálogo de provedores |
| `src/llm.js` | Chamadas aos provedores |
| `src/conta.js` | Leitura do ecossistema publicado na conta do provedor |
| `public/js/motor.js` | Execução: domínio, orquestrador, agentes, workflows e multiagentes |
| `public/js/fabrica.js` | Geração e evolução de ecossistemas |
| `public/js/simulacao.js` | Respostas da Simulação |
| `public/js/grafo.js` | Grafo, animações e câmera |
| `legado/` | Versão antiga em arquivo único, mantida só como referência |

Para acrescentar um provedor compatível com a API da OpenAI, adicione uma entrada ao `CATALOGO` em `src/config.js`.
