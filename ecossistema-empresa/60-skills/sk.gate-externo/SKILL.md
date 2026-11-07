---
id: sk.gate-externo
tipo: skill
nome: Autorização para efeitos externos
versao: 1.2.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — Gate obrigatório para ações externas

Antes de qualquer envio, escrita, publicação, movimentação, exclusão ou atualização de estado:

1. Identificar `conector`, `conta`, `objeto_destino` e autorização do escopo.
2. Produzir prévia exata (`diff`, texto de e-mail, metadados de arquivo, título/corpo de issue ou PR).
3. Distinguir ação solicitada pelo usuário de iniciativa proposta pela IA.
4. Solicitar consentimento/aceite explícito que cite alvo e ação.
5. Validar permissões e riscos, inclusive vazamento de dados ao cruzar serviços.
6. Executar somente com ferramenta real disponível e registrar retorno.
7. Fazer leitura de verificação quando pertinente; se falhar, informar estado indefinido ou pendente, sem repetir automaticamente uma escrita (evitar duplicidade).

## Máquina de estados

`PROPOSTO → PENDENTE_APROVACAO → APROVADO_PELO_USUARIO → EXECUTADO_VERIFICADO`.

Os estados do relatório final continuam: `ATIVO`, `VALIDADO LOCALMENTE`, `PENDENTE`, `BLOQUEADO`, `NÃO OBSERVADO`. A ausência de ferramenta é BLOQUEADO, não sucesso simulado.

## Proibição

A mera presença deste documento não autoriza chamadas externas; esta skill é um contrato operacional, não credencial.
