---
id: sk.analise-desvios
tipo: skill
nome: Análise Rastreável de Desvios
versao: 1.1.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — Análise Rastreável de Desvios

## Objetivo
Conferir variações entre períodos equivalentes sem fabricar contexto financeiro.

## Fórmulas
- Variação absoluta = período atual − período anterior.
- Variação percentual = 100 × (atual − anterior) / anterior, somente quando anterior ≠ 0.
- Saldo entre faturado e recebido = soma(faturado) − soma(recebido), conforme campos documentados.

## Verificações
Uniformizar período, moeda, competência e significado da métrica; detectar nulos e duplicações.
Diferenciar divergência de indicador e erro de dados. Nunca apresentar a IA como responsável
pela aprovação financeira; o gestor decide.

## Saída
`indicador | fonte | periodo_anterior | periodo_atual | variacao_absoluta | variacao_pct | interpretacao | ressalvas`.
