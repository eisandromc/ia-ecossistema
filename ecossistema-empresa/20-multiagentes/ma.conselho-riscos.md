---
id: ma.conselho-riscos
tipo: multiagentes
nome: Conselho de Riscos e Qualidade
versao: 1.1.0
pai: orq.auditoria-gate
usa:
- ag.seguranca
- ag.qualidade-compliance
- ag.suporte-incidentes
plataformas:
- chatgpt
- claude
- copilot
---

# Conselho de Riscos e Qualidade

## Quando acionar
Revisar conteúdo com implicações de segurança, dados pessoais, incidentes ou qualidade.

## Participantes
- `ag.seguranca`: identificar exposição de dados, permissões e recomendações preventivas.
- `ag.qualidade-compliance`: checar completude, evidências, impactos e critérios de aceite.
- `ag.suporte-incidentes`: identificar condições técnicas e tratamento do incidente, quando aplicável.

## Execução
Coletar pareceres em uma rodada, consolidar conflitos e registrar quais dependem de decisão humana.
Revisão lógica não equivale a teste de segurança, auditoria legal ou aprovação formal.

## Saída
Matriz de risco resumida, evidências consultadas, bloqueios, condicionantes e status.
