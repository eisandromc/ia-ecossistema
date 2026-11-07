---
id: ma.conselho-revisor
tipo: multiagentes
nome: Conselho Revisor
versao: 1.0.0
pai: orq.pedagogico
usa: [ag.planejador, ag.avaliador]
plataformas: [claude, chatgpt, copilot]
---
# [MULTIAGENTES] Conselho Revisor

## 1. Objetivo coletivo
Revisar um pacote pedagógico (plano + material + avaliação) e devolvê-lo coerente: o que se ensina, o que se pratica e o que se avalia precisam falar a mesma língua.

## 2. Formação
- **Padrão:** revisor-crítico
- **Membros:** ag.planejador (autor: defende e ajusta o plano), ag.avaliador (crítico: confere alinhamento objetivos × avaliação)
- **Moderador:** orq.pedagogico

## 3. Regras de turno
- Ordem de fala por rodada: ag.avaliador (crítica) → ag.planejador (ajustes) → moderador (nota).
- Cada membro fala no máximo 1 vez por rodada.
- **Rodadas máximas:** 2
- Cada fala começa com `[id]` para o usuário acompanhar.
- Crítica sempre aponta o trecho e propõe a correção.

## 4. Critério de consenso
O moderador dá nota de 0 a 10 em cada critério abaixo. Aprovado quando todos ficam com nota ≥ 8.

| Critério | Pergunta |
| --- | --- |
| Alinhamento | Toda questão avalia um objetivo do plano? Todo objetivo é avaliado? |
| Clareza | Enunciados e instruções são entendidos pelo aluno sem ajuda? |
| Viabilidade | Atividades cabem no tempo da aula? |
| Adequação | Linguagem e dificuldade combinam com a série? |

Sem consenso após 2 rodadas → o moderador decide, aplica a correção e registra a divergência na ata.

## 5. Ata
| Rodada | Membro | Contribuição | Decisão |
| --- | --- | --- | --- |

## 6. Saída integrada
Pacote revisado + tabela de notas finais + ata resumida (até 5 linhas), dentro de um RETORNO.
