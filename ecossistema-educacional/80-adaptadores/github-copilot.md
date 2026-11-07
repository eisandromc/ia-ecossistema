---
id: adaptador.github-copilot
tipo: adaptador
nome: Adaptador GitHub Copilot (repositório)
versao: 1.0.0
---
# Adaptador — GitHub Copilot (repositório)

> Variação para levar o ecossistema a um repositório e usar no Copilot do VS Code ou do github.com. Os nomes de arquivos e pastas abaixo mudam entre versões do Copilot: confirme na documentação atual antes de usar.

## Mapeamento

| Recurso | Arquivo no repositório |
| --- | --- |
| Domínio + protocolo | `.github/copilot-instructions.md` (instruções do repositório) |
| Orquestradores e agentes | `.github/agents/<id>.agent.md` (agentes personalizados) |
| Workflows | `.github/prompts/<id>.prompt.md` (acionados como comando `/nome`) |
| Skills | `.github/skills/<nome>/SKILL.md`, quando suportado; senão `.github/instructions/<nome>.instructions.md` |
| RAG | Pasta `docs/fontes/` referenciada nas instruções |
| Subagentes, Multiagentes | Seções dentro dos arquivos de agente |

## Passo a passo

1. Copie o conteúdo do domínio e o resumo do protocolo para `.github/copilot-instructions.md`.
2. Para cada `orq.*` e `ag.*`, crie `.github/agents/<id>.agent.md` com o conteúdo do arquivo (o cabeçalho YAML pode ser trocado pelo formato de cabeçalho que o Copilot pede: nome, descrição, ferramentas).
3. Para cada `wf.*`, crie `.github/prompts/<id>.prompt.md` com a tabela de passos.
4. Copie `60-skills/` para `.github/skills/` (ou converta em `.instructions.md`).
5. Copie `70-rag/fontes/` para `docs/fontes/`.
6. Faça commit e teste no chat do Copilot com os casos `[fumaça]`.
