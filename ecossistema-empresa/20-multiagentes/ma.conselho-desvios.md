---
id: ma.conselho-desvios
tipo: multiagentes
nome: Conselho de Análise de Desvios
versao: 1.1.0
pai: orq.corporativo
usa:
- ag.financeiro-erp
- ag.dados-bi
- ag.analista-negocios
plataformas:
- chatgpt
- claude
- copilot
---

# Conselho de Análise de Desvios

## Quando acionar
Revisão de análises de desvios financeiros, reconciliações ou relatórios de liderança.
Não use dados reais sem autorização.

## Participantes e responsabilidades
1. `ag.financeiro-erp`: validar significado financeiro, períodos, faturado e recebido.
2. `ag.dados-bi`: confirmar fórmulas, ausências, duplicidades e totais.
3. `ag.analista-negocios`: revisar objetivo e consequência operacional.

## Rodadas e limite
Uma rodada independente de análise e uma rodada de revisão cruzada, no máximo.
Se funções forem simuladas sequencialmente em uma única conversa, declare isso.

## Saída
Tabela de evidências (fonte/campo/fórmula), divergências, síntese executiva,
recomendações e decisão humana pendente. Não determinar sanções, cobranças ou ações financeiras.
