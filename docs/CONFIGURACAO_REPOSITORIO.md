# Configuração do repositório

## About no GitHub

A configuração abaixo é recomendada para a área **About** do repositório.

| Campo | Valor recomendado |
| --- | --- |
| Descrição | Ecossistemas de IA, agentes, workflows, skills, RAG e ferramentas para educação e empresas. |
| Website | Deixar vazio até existir uma página pública validada. |
| Tópicos | `artificial-intelligence`, `multi-agent-systems`, `prompt-engineering`, `rag`, `education-technology`, `chatgpt`, `claude-ai`, `github-copilot`, `nodejs` |

## Configurações versionadas

| Arquivo | Finalidade |
| --- | --- |
| `.editorconfig` | Padronização de texto e indentação. |
| `.gitignore` | Exclusão de segredos, dependências e arquivos locais. |
| `CODEOWNERS` | Definição do responsável pela revisão. |
| `CONTRIBUTING.md` | Processo de contribuição e promoção de branches. |
| `SECURITY.md` | Orientação para relato responsável. |
| `dependabot.yml` | Atualização semanal de dependências e Actions. |
| `branch-flow.yml` | Validação de `branch de trabalho → develop → test → main`. |
| `painel-ci.yml` | Instalação, testes e verificação do painel. |
| Templates de issue e PR | Padronização de solicitações e revisões. |

## Configurações no GitHub ainda necessárias

Os arquivos deste repositório não conseguem criar rulesets remotamente. Após o primeiro workflow bem-sucedido, crie regras para `develop`, `test` e `main` e torne obrigatórios:

- `branch-flow`
- `painel-tests` quando a alteração atingir `painel/`

Também bloqueie exclusões e force-pushes, exija Pull Requests e defina a revisão conforme a equipe disponível.
