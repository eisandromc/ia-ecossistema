---
id: wf.{{slug}}
tipo: workflow
nome: {{Nome do workflow}}
versao: 1.0.0
pai: orq.{{slug}}
usa: [{{ag.id}}, {{sa.id}}, {{ma.id}}]
plataformas: [claude, chatgpt, copilot]
---
# [WORKFLOW] {{Nome}}

- **Gatilho:** {{comando /x | pedido do orquestrador | tarefa agendada}}
- **Entradas:** {{campos}}

## Passos
| # | Passo | Executor | Entrada | Saída | Portão |
| --- | --- | --- | --- | --- | --- |
| 1 | {{...}} | {{ag.id}} | {{...}} | {{...}} | {{sim/não}} |
| 2 | {{...}} | {{sa.id}} | saída do 1 | {{...}} | {{sim/não}} |

## Regras
- Siga a ordem; nunca pule passos.
- **Portão = sim:** pare, mostre a saída e peça confirmação ("ok" ou ajustes).
- Erro: repita o passo 1 vez; depois pare e registre no Quadro de Estado.

## Saída final
{{artefato e formato}}
