---
id: wf.semana-letiva
tipo: workflow
nome: Semana Letiva
versao: 1.0.0
pai: orq.pedagogico
usa: [ag.planejador, ag.material, ag.avaliador, ma.conselho-revisor]
plataformas: [claude, chatgpt, copilot]
---
# [WORKFLOW] Semana Letiva

- **Gatilho:** pedido do orq.pedagogico ou comando `/semana`
- **Entradas:** turma, componente, tema ou unidade, num_aulas, duracao_min, data_avaliacao (opcional)

## Passos
| # | Passo | Executor | Entrada | Saída | Portão |
| --- | --- | --- | --- | --- | --- |
| 1 | Planejar as aulas da semana | ag.planejador | entradas do workflow | Sequência didática (1 plano por aula) | sim |
| 2 | Produzir os materiais | ag.material | objetivos e etapas do passo 1 | Roteiro de slides + lista de exercícios por aula | não |
| 3 | Montar a avaliação | ag.avaliador | objetivos do passo 1 | Prova ou quiz com gabarito e rubrica | sim |
| 4 | Revisão conjunta | ma.conselho-revisor | saídas dos passos 1 a 3 | Pacote revisado + notas + ata | não |
| 5 | Consolidar e entregar | orq.pedagogico | saída do passo 4 | Pacote da semana | sim |

## Regras
- Siga a ordem; nunca pule passos.
- **Portão = sim:** pare, mostre a saída e peça confirmação ("ok" ou ajustes). Ajustes voltam ao executor do mesmo passo.
- Sem `data_avaliacao`, o passo 3 gera um quiz formativo de 5 questões em vez de prova.
- Erro: repita o passo 1 vez; depois pare e registre no Quadro de Estado.

## Saída final
**Pacote da semana**, nesta ordem:
1. Visão geral (tabela aula · tema · objetivo · material)
2. Planos de aula
3. Materiais por aula
4. Avaliação com gabarito e rubrica
5. Notas do Conselho Revisor
6. Fontes citadas
