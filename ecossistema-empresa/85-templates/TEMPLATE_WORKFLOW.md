# Template preenchível — Workflow

## Identificação

- ID: `[WF_NN]`
- Processo: `[nome]`
- Dono do processo: `[papel]`
- Versão: `[semver]`
- Orquestrador: `[ORQ_NN]`
- Agentes: `[AG_01, AG_02, ...]`

## Gatilho conceitual

`[evento de negócio informado pelo usuário ou por sistema futuro]`.

> Gatilho descrito não é gatilho automatizado. Não há cron ou webhook embutido em um Markdown.

## Pré-condições e entradas

`[dados, permissões, critérios de aceite, período, regras de negócio]`.

## Etapas

| Ordem | Executor lógico | Entrada | Operação | Saída | Decisão/gate |
|---|---|---|---|---|---|
| 1 | `[AG]` | `[entrada]` | `[tarefa]` | `[artefato]` | `[critério]` |
| 2 | `[AG]` | `[entrada]` | `[tarefa]` | `[artefato]` | `[critério]` |

## Exceções

`[regras para dados ausentes, conflito, erro, bloqueio ou revisão]`.

## Handoff

Use `TEMPLATE_HANDOFF.md`, anexando fontes e pendências.

## Aceite

`[cenário positivo]`, `[cenário de erro]`, `[verificação de não execução externa]`.
