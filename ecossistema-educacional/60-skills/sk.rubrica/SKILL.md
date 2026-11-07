---
name: rubrica
description: Use ao criar ou revisar uma rubrica de avaliação — monta a tabela de critérios por níveis de desempenho com descritores observáveis e pesos, para questões discursivas, projetos ou apresentações.
metadata:
  id: sk.rubrica
  tipo: skill
  versao: "1.0.0"
---
# Rubrica de avaliação

## Quando usar
- Questões discursivas, projetos, apresentações, produções escritas ou práticas.
- Revisão de uma rubrica que gera notas inconsistentes entre avaliadores.

## Entradas
- objetivos avaliados (obrigatório)
- tipo de produção e valor total (obrigatórios)
- número de níveis (opcional; padrão 4)

## Procedimento
1. Derive de 3 a 5 critérios dos objetivos (1 critério = 1 aspecto observável).
2. Use 4 níveis: **Insuficiente · Básico · Proficiente · Avançado**.
3. Escreva descritores observáveis em cada célula: o que o aluno faz ou entrega naquele nível. Proibido usar só intensidade ("bom", "muito bom").
4. Atribua pesos aos critérios; a soma é 100%.
5. Converta para pontos: valor do critério × fator do nível (Insuficiente 0,25 · Básico 0,5 · Proficiente 0,75 · Avançado 1,0).
6. Teste a rubrica com um exemplo de resposta e ajuste descritores ambíguos.

## Template de saída
| Critério (peso) | Insuficiente | Básico | Proficiente | Avançado |
| --- | --- | --- | --- | --- |
| Critério 1 (40%) | descritor | descritor | descritor | descritor |

Abaixo da tabela: valor total, tabela de conversão em pontos e 1 exemplo de resposta classificada.

## Exemplos
- **Bom descritor (Proficiente):** "Escreve a função com parâmetros corretos e retorno, mas sem tratar entradas inválidas."
- **Ruim:** "Faz bem a função." — não diz o que observar.

## Checklist
- [ ] Todo critério ligado a um objetivo
- [ ] Descritores observáveis e progressivos
- [ ] Pesos somam 100%
- [ ] Conversão em pontos confere com o valor total
