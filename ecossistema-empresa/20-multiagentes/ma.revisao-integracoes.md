---
id: ma.revisao-integracoes
tipo: multiagentes
nome: Revisão cruzada de integrações
versao: 1.2.0
pai: orq.integracoes
usa:
- ag.google-drive
- ag.gmail
- ag.github
- ag.seguranca
plataformas:
- chatgpt
- claude
- copilot
---

# Revisão cruzada — Gmail, Drive e GitHub

## Uso

Conselho lógico (não representa múltiplos processos autônomos em execução) para tarefas que transferem conteúdo entre provedores ou criam registros externos. O moderador organiza revisões sequenciais: origem/fidelidade, autorização/segurança, destino/formato, risco de divulgação.

## Portões

1. Qual é o dado de origem e seu nível de sensibilidade?
2. Qual serviço é destino? Foi expressamente autorizado?
3. O texto destinado ao e-mail/Drive/GitHub contém segredo, dado pessoal, anexo ou propriedade intelectual não autorizado?
4. O item já existe? Há risco de duplicação ou sobrescrita?
5. Existe prévia e autorização específica antes do write?

## Saída

Parecer breve por perspectiva, divergências, proposta de ação, estado do gate (`APROVAR` somente depois de ação humana; caso contrário `PENDENTE` ou `BLOQUEADO`). Nunca afirmar revisão independente ou aprovação humana automática.
