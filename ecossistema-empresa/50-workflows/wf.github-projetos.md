---
id: wf.github-projetos
tipo: workflow
nome: Consultar projetos e repositórios GitHub
versao: 1.2.0
pai: orq.integracoes
usa:
- ag.github
- ag.projetos-implantacao
- sk.gate-externo
plataformas:
- chatgpt
- claude
- copilot
---

# Workflow — Acompanhar projetos de software no GitHub

## Gatilhos

"Verifique o andamento do repositório", "Relate issues abertas e PRs pendentes", "Crie uma issue a partir de uma necessidade aprovada".

| Etapa | Responsável | Produto | Gate |
|---|---|---|---|
| 1. Definir escopo | `ag.github` | `owner/repo`, período e permissões | Sem alvo definido → PENDENTE |
| 2. Consultar | `ag.github` | Código, README, issues, PRs, pipelines e evidências | Repositório sem acesso → BLOQUEADO |
| 3. Interpretar | `ag.projetos-implantacao` | Estado do trabalho e riscos, distinguindo hipótese de fato | Fontes obrigatórias |
| 4. Propor | `ag.github` | Issue, mudança, branch ou PR em rascunho | Sem mutação |
| 5. Aprovar | Humano | Aceite com repositório, branch, título e corpo/diff | Sem aceite → PENDENTE |
| 6. Executar | `ag.github` | Escrita por conector somente se disponível/autorizada | Evitar gravação em `main` |
| 7. Verificar | `ag.github` | URL do issue/PR ou SHA, retorno observado | Resultado não inventado |

**Limite:** os quadros GitHub Projects v2 não podem ser declarados consultados sem uma ferramenta compatível, mesmo que issues e pull requests sejam acessíveis.
