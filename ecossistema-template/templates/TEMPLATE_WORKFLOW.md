---
id: "wf.<nome>"
tipo: "workflow"
versao: "0.1.0"
status_operacional: "PENDENTE"
---
# Workflow — <nome>

Gatilho: <evento ou pedido>.  
Pré-condições: <dados, permissão e fonte>.

| ordem | ação | executor | entrada | saída | portão humano | fallback |
|---:|---|---|---|---|---|---|
| 1 | <ação> | <id> | <entrada> | <saída> | sim/não | <fallback> |

Estados: `rascunho → em_revisão → liberado | devolvido | cancelado`.
