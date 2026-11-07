# Guia prático — uso dos arquivos no ChatGPT, Claude e Copilot

## Aviso de compatibilidade

`.md` é um formato portável de texto, mas **não há garantia** de importação automática para sistemas de agentes ou execução de workflows. Recursos de arquivos, projetos, instruções personalizadas, tamanho de contexto, agentes e integrações variam por produto, plano e ambiente corporativo. Confirme as limitações atuais na documentação oficial da ferramenta escolhida.

| Recurso | ChatGPT Web | Claude | Copilot |
|---|---|---|---|
| Colar prompt em chat | uso textual quando disponível | uso textual quando disponível | uso textual quando disponível |
| Anexar arquivos `.md` | sujeito ao suporte do chat/projeto | sujeito ao suporte do projeto/chat | sujeito ao suporte do produto |
| Vários agentes independentes | **não pressupor** em chat padrão | **não pressupor** em chat padrão | **não pressupor** em chat padrão |
| Agendar workflow só com MD | não | não | não |
| Acessar sistemas AllTech com este zip | não | não | não |
| RAG indexado e validado só com anexos | não comprovado | não comprovado | não comprovado |

## Método universal sem programação

1. Inicie um chat ou espaço de trabalho apropriado e carregue `POLITICA_GLOBAL.md`.
2. Cole o conteúdo de `ORQ_01_CORPORATIVO.md` em seguida, como instrução de tarefa, respeitando a hierarquia da plataforma.
3. Adicione os agentes e workflow necessários, sem anexar todos indiscriminadamente se o contexto ficar extenso.
4. Anexe os dados do exercício, explicitando que são fictícios.
5. Escreva: **“Execute o workflow como funções lógicas sequenciais, apresente handoffs textuais, não alegue agentes reais nem ações externas e informe a fonte de cada número.”**
6. Revise o resultado com `ORQ_03_AUDITORIA_GATE.md` e compare cálculos com o gabarito.
7. Registre aceite humano antes de usar qualquer saída em processo real.

## Exemplo — ChatGPT

> Use `POLITICA_GLOBAL.md` e o orquestrador `ORQ_01_CORPORATIVO.md`. Execute `WF_01_ANALISE_FATURAMENTO.md` sobre o CSV anexo, usando logicamente AG_02, AG_08 e AG_12. Forneça o total faturado, recebido e em aberto, a comparação entre períodos, as fórmulas, os riscos e o status final. Não faça chamadas externas.

## Exemplo — Claude

> Considere os mesmos arquivos como contexto textual. Informe primeiro quais documentos foram efetivamente acessados, depois execute os passos do workflow e faça a revisão final. Se o arquivo não puder ser lido, não invente conteúdo.

## Exemplo — Copilot

> Com as instruções e dados disponíveis **no contexto autorizado**, analise o CSV fictício seguindo o workflow. Apresente resultados e ressalvas. Não assuma acesso a Microsoft 365, ERP, agentes configurados ou sistemas externos apenas pela presença dos Markdown.

## Para uma aplicação real

A implementação exige: plataforma de runtime/orquestração, chamadas de modelos/serviços, camada de autenticação, contrato de APIs autorizado, logs, gestão de erros, testes, observabilidade, consentimentos e governança. **Integrações com AllTech não foram implementadas**. A documentação oficial da AllTech pode orientar uma análise de viabilidade técnica, mas não substitui credenciais e autorização.
