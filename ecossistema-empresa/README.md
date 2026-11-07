# Ecossistema Empresarial AllTech — compatibilidade v1.1.0

Pacote estruturado para ser colocado **inteiro** dentro do diretório `ecossistema-empresa/`.
Mantém os 12 agentes, 3 orquestradores e 8 workflows originais; acrescenta manifesto raiz,
domínio roteador, exemplos de multiagentes, subagentes, skills, RAG documental e adaptadores.

## Arquivo obrigatório
`ecosystem.yaml` está **nesta raiz**. O carregador deve apontar para o diretório
`ecossistema-empresa`, não para `30-agentes` ou `95-original`.

## Diferenças para v1.0.0
- O pacote anterior não tinha `ecosystem.yaml`, impedindo carregadores que o exigem.
- O novo pacote usa `00-dominio`, `10-orquestradores`, `20-multiagentes`,
  `30-agentes`, `40-subagentes`, `50-workflows`, `60-skills`, `70-rag`,
  `80-adaptadores` e `90-testes`.
- As versões antigas foram preservadas em `95-original` e materiais adicionais em `75-exemplos`, `85-guias`, `85-templates`.
- Cada recurso indexado tem front matter YAML com ID, tipo, nome, versão, pai, usa e plataformas.

## Verificação
Validação local de sintaxe YAML, unicidade de IDs, caminhos existentes,
referências válidas, dependências e limite de especialistas por orquestrador.
A execução no aplicativo local de terceiros NÃO FOI TESTADA.

## Uso seguro
O material é didático e utiliza dados fictícios. Não estabelece integração real com a AllTech
ou outros sistemas corporativos. Decisões e ações externas requerem aprovação humana.

Para instruções de instalação e configurações `.env`, veja `INSTALL.md` e `.env.exemplo`.

## Integrações agênticas — v1.2.0

Esta atualização acrescenta **um orquestrador de integrações, três agentes conectores, quatro workflows, um conselho de revisão e quatro skills**, referenciados em `ecosystem.yaml`. Consulte `80-adaptadores/CONEXOES_CHATGPT.md` e `80-adaptadores/acoes-integracoes.yaml` para detalhes.

- Google Drive: leitura e gravação mediante conector disponível e aprovação explícita para escrita.
- GitHub: consulta a repositórios/código/issues/PRs, com escrita mediante aprovação; acesso direto aos quadros GitHub Projects v2 **não confirmado**.
- Gmail: fluxo de leitura/rascunho/resposta preparado; **conexão pendente**, não substituída por uma conexão Drive.

**Importante:** o manifesto é um catálogo de prompts, não uma ponte OAuth nem integração executável com o app local. Testes de catálogo são estruturais, não funcionais.
