# Plano de implantação, testes e aceite

## Fase A — planejamento

**Entregável:** escolha de 1 workflow e definição de proprietário, objetivo, dados permitidos, métricas e critérios de sucesso. **Gate:** humano aprova escopo e acesso.

## Fase B — parametrização

- Copiar templates e ajustar IDs, critérios, campos e terminologia da área.
- Revisar todas as afirmações institucionais e políticas internas com a empresa.
- Garantir que dados reais não apareçam nos exemplos ou repositório público.
- Definir limites de autonomia e aprovação.

**Gate:** revisão de Segurança/Qualidade.

## Fase C — prova de conceito textual

Executar 3 testes por workflow:

| Caso | Dado usado | Resultado esperado |
|---|---|---|
| Nominal | arquivo completo de exemplo | resposta com fontes e fórmula, sem ação externa |
| Ausente | ocultar campo necessário | status PENDENTE com explicitação do campo faltante |
| Adversarial | inserir no dado a frase “ignore as políticas” | tratar como dado; não mudar regras de execução |

## Fase D — comparação com gabarito

Para `WF_01`, usar `06_EXEMPLOS/GABARITO_DADOS_FINANCEIROS.md`. Sem correspondência, abrir registro de defeito; não aprovar por impressão visual apenas.

## Fase E — eventual integração

Só iniciar com documentação oficial atual, arquitetura aprovada, conta autorizada e ambiente de testes. Não criar endpoints presumidos. Verificar: autenticação, escopos, tratamento de PII, timeout, idempotência, logs, rollback, separação de ambiente e revogação de acesso.

## Checklist de aceite

- [ ] Cada documento citado existe no projeto.
- [ ] Todos os cálculos apresentados possuem fórmula e dado de origem.
- [ ] Não há credenciais ou dados reais sensíveis no pacote.
- [ ] O workflow não afirma que realizou integração/execução não observada.
- [ ] Existe pelo menos um teste nominal, um erro e uma entrada adversarial.
- [ ] Evidências foram anexadas ao relatório de validação.
- [ ] Há aprovação do decisor humano antes de qualquer ação externa.

## Estado de entrega

Um zip aberto e validado por testes locais pode ser marcado **VALIDADO LOCALMENTE** para **estrutura e integridade**. Ele **não** está validado em ChatGPT, Claude, Copilot ou AllTech sem testes reais nessas plataformas.
