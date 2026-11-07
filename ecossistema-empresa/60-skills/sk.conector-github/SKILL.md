---
id: sk.conector-github
tipo: skill
nome: Operação via GitHub
versao: 1.2.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — GitHub, leitura de projetos de software e escrita sob revisão

## Disponibilidade

Requer GitHub conectado e acesso ao repositório alvo. Não presume permissão de escrita nem de leitura de quadros Projects v2.

## Ações de leitura observadas

- `mcp__GitHub__search_repositories`, `mcp__GitHub__get_repo`, `mcp__GitHub__fetch_file`
- `mcp__GitHub__search_issues`, `mcp__GitHub__search_prs`, `mcp__GitHub__fetch_commit_workflow_runs`

## Ações de escrita sob aprovação explícita

- `mcp__GitHub__create_issue`, `mcp__GitHub__create_branch`, `mcp__GitHub__create_pull_request`, `mcp__GitHub__update_file`
- Evitar mesclagens ou escrita direta em branch protegida; caso solicitadas, exigir aprovação específica e verificação de permissões.

## Saída

Repositório identificado, permissão efetiva, referências de issue/PR/arquivo, diferenças propostas, autorização humana e retorno observado. Não inventar números de issue, SHA ou URLs.
