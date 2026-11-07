---
id: wf.gmail-respostas
tipo: workflow
nome: Preparar e responder mensagens Gmail
versao: 1.2.0
pai: orq.integracoes
usa:
- ag.gmail
- ag.crm-comercial
- sk.gate-externo
plataformas:
- chatgpt
- claude
- copilot
---

# Workflow — Responder e-mails da conta conectada

## Gatilhos

"Leia a mensagem do cliente X", "Responda à conversa sobre implantação", "Prepare uma resposta ao fornecedor".

| Etapa | Responsável | Produto | Gate |
|---|---|---|---|
| 1. Verificar conexão | `ag.gmail` | Conector e ações reais Gmail encontrados | Se não conectado → BLOQUEADO |
| 2. Encontrar thread | `ag.gmail` | ID da conversa, remetente, assunto | Sem identificação → PENDENTE |
| 3. Contextualizar | `ag.crm-comercial` quando necessário | fatos e tom, sem dados fictícios como reais | Fontes e sigilo |
| 4. Redigir | `ag.gmail` | Resposta completa com destinatários e anexos previstos | Sem invenções |
| 5. Revisar | Humano | Aceite do conteúdo exato, destino e envio | Sem aceite → apenas rascunho |
| 6. Responder | `ag.gmail` | Executar ação **real de reply/send**, se disponível | Nunca simular envio |
| 7. Verificar | `ag.gmail` | ID/estado de envio retornado | Sem evidência, estado não confirmado |

**Nota operacional:** a integração Gmail permanece PENDENTE até o usuário conectar o plugin e a sessão expor as ações correspondentes. Este workflow não atribui nomes de ferramentas hipotéticos.
