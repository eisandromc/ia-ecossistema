---
id: sk.handoff
tipo: skill
nome: Handoff com Rastreamento
versao: 1.1.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — Handoff com Rastreamento

## Objetivo
Estruturar passagens entre funções lógicas sem fingir uma automação inexistente.

## Envelope HANDOFF
`task_id`, `origem`, `destino`, `objetivo`, `entradas`, `fontes`, `criterios_aceite`, `restricoes`, `status`.

## Envelope RETORNO
`task_id`, `recurso`, `entrega`, `evidencias`, `calculos`, `riscos`, `pendencias`, `status`, `proxima_acao`.

## Regras
Sem dados essenciais, não inventar; sem autorização explícita, não transferir dados sensíveis.
Registre separadamente o que ocorreu de fato versus o que foi apenas encenado numa conversa.
