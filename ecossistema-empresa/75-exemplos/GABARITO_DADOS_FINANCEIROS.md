# Gabarito financeiro — dados inteiramente fictícios

Fonte: `06_EXEMPLOS/dados_financeiros_ficticios.csv` (10 registros sintéticos, cinco clientes, duas competências). **Não representa números da AllTech.**

| Competência | Faturado (R$) | Recebido (R$) | Custo direto (R$) | Saldo em aberto (R$) |
|---|---:|---:|---:|---:|
| 2026-09 | 150,000.00 | 127,000.00 | 70,000.00 | 23,000.00 |
| 2026-10 | 161,000.00 | 146,000.00 | 74,100.00 | 15,000.00 |

> **Convenção numérica desta tabela:** vírgula separa milhares e ponto separa centavos (padrão do gerador). No relatório final em pt-BR, converta a formatação para `1.234,56` sem alterar valores.

## Cálculos esperados

- Variação absoluta do faturamento: `R$ 11,000.00` (outubro menos setembro).
- Variação percentual do faturamento: `7.33%` = `(161000 - 150000) / 150000 × 100`.
- Saldo em aberto de cada competência: `valor_faturado − valor_recebido`.
- Custo direto: soma da coluna `custo_direto`, não uma despesa contábil total.

## Verificações

- Cada cliente aparece uma vez por competência.
- Todos os recebimentos são menores ou iguais aos respectivos faturamentos no conjunto sintético.
- **Não há vencimento, inadimplência, base de contratos, metas ou data de ação aprovadas**; não inferir esses indicadores.
- “Tempo até ação” permanece **PENDENTE DE DEFINIÇÃO E MEDIÇÃO** por ausência de aprovação da definição e timestamps de aprovação.
