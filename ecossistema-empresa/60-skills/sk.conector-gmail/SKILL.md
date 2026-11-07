---
id: sk.conector-gmail
tipo: skill
nome: Operação via Gmail
versao: 1.2.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — Gmail, triagem, rascunho e resposta

## Estado inicial

`PENDENTE`: o Gmail deve ser conectado e suas operações confirmadas na sessão. **Conectar Google Drive não conecta Gmail automaticamente.**

## Procedimento

1. Verificar se existe conector Gmail instalado e autenticado; obter ações disponíveis apenas do catálogo real da sessão.
2. Localizar thread solicitada por critérios mínimos e apropriados.
3. Produzir síntese factual e resposta proposta.
4. Mostrar conta remetente, destinatários, assunto, corpo integral e anexos, quando aplicável.
5. Solicitar aceite explícito para enviar a resposta específica.
6. Se ação de reply/send estiver disponível, executar e registrar ID/resultado. Se só houver rascunho, não declarar envio.

## Restrições

- Não inventar nomes de ações que não foram disponibilizadas.
- Não enviar mensagens em massa nem respostas contínuas em nome do usuário.
- Não expor conteúdos do Gmail a terceiros ou a repositórios sem autorização de transferência.
- Se a conta não estiver conectada, bloquear a etapa de leitura e envio; oferecer rascunho apenas quando o usuário fornecer o conteúdo.
