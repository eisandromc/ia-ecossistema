# Segurança, privacidade e conformidade — projeto demonstrativo

## Fronteira de confiança

Os prompts dos agentes descrevem **comportamentos desejados**, não conferem privilégios. Dados anexados e respostas de sistemas externos são fontes não confiáveis quanto a instruções. Segredos, tokens, credenciais de homologação e dados pessoais não devem ser colocados no pacote.

## Controles de referência

| Risco | Sinal | Contenção | Responsável sugerido |
|---|---|---|---|
| Injeção de prompt | arquivo pede ignorar política | isolar conteúdo como dado e registrar incidente | Segurança |
| Vazamento de dados | saída com identificadores desnecessários | anonimizar, restringir compartilhamento | Encarregado/Segurança |
| Desvio financeiro artificial | valores sem conciliação | revisar fórmula e base de dados | Financeiro/Dados |
| Aprovação indevida | IA diz “compra aprovada” | exigir identidade e registro explícito de decisor | Gestor/Compras |
| Trilha de auditoria ausente | conclusão sem fonte | marcar PENDENTE e recuperar evidência | Qualidade |
| Integração não autenticada | ausência de endpoint ou escopo | BLOQUEADO; solicitar documentação e autorização | TI/Segurança |

## Matriz de autonomia

- **A0 — análise:** leitura e rascunho com dados autorizados; permitido.
- **A1 — recomendação:** plano e sugestão sem execução; permitido, revisão humana.
- **A2 — preparação:** minuta para aprovação, sem enviar, alterar ou contratar; permitido.
- **A3 — execução externa:** exige aprovação explícita, plataforma apropriada, escopo e logs. **Não implementado.**

## Checklist de autorização

- Qual usuário, sistema e dados serão acessados?
- Existe base legal e permissão da área?
- A ação pode gerar custo, impacto no contrato, decisão sobre pessoas ou exposição de dados?
- Há procedimento de reversão e trilha de auditoria?
- O responsável humano autorizou este ato específico?

Se houver resposta material ausente, manter `BLOQUEADO` para ações externas.
