---
id: wf.drive-documentos
tipo: workflow
nome: Consultar e gravar documentos Drive
versao: 1.2.0
pai: orq.integracoes
usa:
- ag.google-drive
- ag.documentacao
- sk.gate-externo
plataformas:
- chatgpt
- claude
- copilot
---

# Workflow — Consultar e gravar documentos no Google Drive

## Gatilhos

"Localize o relatório no Drive", "Crie uma pasta de documentos", "Salve o relatório aprovado".

| Etapa | Agente | Ação | Gate |
|---|---|---|---|
| 1. Escopo | `ag.google-drive` | Confirmar pasta-alvo, documento, finalidade e autorização de leitura | Sem identidade inequívoca → PENDENTE |
| 2. Descoberta | `ag.google-drive` | Buscar com o conector e obter IDs/metadados | Se sem acesso → BLOQUEADO |
| 3. Leitura | `ag.google-drive` | Ler conteúdo necessário, respeitar tipo MIME e permissões | Documento sensível → restringir uso |
| 4. Preparação | `ag.documentacao` | Criar proposta/versão ou diff com fontes e formato | Revisor confere integridade |
| 5. Aprovação | Humano | Examinar destino, conteúdo, nome, substituição/compartilhamento | Sem aprovação → PENDENTE |
| 6. Gravação | `ag.google-drive` | Criar arquivo, importar documento ou atualizar artefato existente | Usar ação real da sessão |
| 7. Validação | `ag.google-drive` | Ler ID/metadados/conteúdo quando possível | Evidência de retorno obrigatória |

Saídas: documento/alteração, URL/ID real da ferramenta, resumo da operação, fontes, estado.

Em Google Docs, Sheets e Slides nativos, usar as ações próprias; `update_file(file_uri=...)` não substitui edições estruturadas desses formatos.
