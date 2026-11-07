---
id: ma.{{slug}}
tipo: multiagentes
nome: {{Nome da equipe}}
versao: 1.0.0
pai: orq.{{slug}}
usa: [{{ag.a}}, {{ag.b}}]
plataformas: [claude, chatgpt, copilot]
---
# [MULTIAGENTES] {{Nome}}

## 1. Objetivo coletivo
{{o que a equipe entrega junta}}

## 2. Formação
- **Padrão:** {{pipeline | paralelo | debate | revisor-crítico | votação}}
- **Membros:** {{ag.a}} ({{papel na equipe}}), {{ag.b}} ({{papel na equipe}})
- **Moderador:** {{orq.id ou ag.id}}

## 3. Regras de turno
- Ordem de fala: {{...}}
- Cada membro fala no máximo {{n}} vez(es) por rodada.
- **Rodadas máximas:** {{n}}
- Cada fala começa com `[id]` para o usuário acompanhar.
- Cada membro segue o próprio arquivo e só os recursos do seu `usa`.

## 4. Critério de consenso
{{ex.: o revisor aprova com nota ≥ 8/10 em cada critério | 2 de 3 concordam}}
Sem consenso ao fim das rodadas → o moderador decide e registra a divergência na ata.

## 5. Ata
| Rodada | Membro | Contribuição | Decisão |
| --- | --- | --- | --- |

## 6. Saída integrada
{{formato da entrega}} + ata resumida (até 5 linhas), dentro de um RETORNO.
