# WF_02 — Qualificação e proposta comercial B2B

**Categoria:** workflow lógico baseado em prompts  
**Status inicial:** PENDENTE  
**Orquestrador sugerido:** `ORQ_01_CORPORATIVO`; complementar `ORQ_02_COMERCIAL_IMPLANTACAO` quando houver ciclo de venda/implantação.  
**Agentes:** AG_03_CRM_COMERCIAL, AG_01_ANALISTA_NEGOCIOS, AG_09_PROJETOS_IMPLANTACAO.

## Objetivo e fronteira

Qualificação e proposta comercial B2B. O fluxo representa um processo didático de análise e coordenação; **não aciona sistemas automaticamente**, não concede autorizações e não comprova práticas internas da AllTech.

## Pré-condições

- Objetivo e domínio identificados; fontes disponibilizadas com permissão.
- **Entrada:** demanda, requisitos, dados da oportunidade, condições comerciais fornecidas, política autorizada.
- Dono da tarefa e ponto de decisão humana definidos.
- Requisitos de LGPD, acesso e confidencialidade revisados quando pertinentes.
- Resultado esperado: Oportunidade qualificada e proposta preliminar com escopo e critérios de aceite.

## Passo a passo com handoffs

| Fase | Tarefa | Produto | Gate / exceção |
|---|---|---|---|
| 0. Receber | ORQ_01 recebe objetivo, permissões e arquivos | contrato de entrada | falta fonte essencial → PENDENTE |
| 1. Preparar | especialista primário confere formato e dados | inventário e dicionário | arquivo inconsistente → solicitar ajuste |
| 2. Analisar | especialista produz análise rastreável | tabela/relatório inicial | números sem fonte → BLOQUEADO para publicação |
| 3. Especializar | especialistas complementares tratam dependências | análises complementares | restrição legal ou técnica → consultar responsável |
| 4. Consolidar | ORQ_01 monta entregável único | Ficha da oportunidade, minuta de proposta, estimativa com premissas e matriz de riscos | não transformar propostas em ações |
| 5. Revisar | AG_12 aplica checagens de qualidade | parecer e correções | falha crítica → BLOQUEADO |
| 6. Aprovar | responsável humano decide sobre uso e execução | decisão/aceite registrado | sem aceite → PENDENTE |

## Procedimento específico

Mapear necessidade e stakeholders; separar escopo do que está fora; conferir se preço, desconto e prazo provêm de fonte autorizada; levantar risco de implantação. Para cada conclusão inclua fonte, período, transformação e limites.

## Saídas e evidências

**Artefatos:** Ficha da oportunidade, minuta de proposta, estimativa com premissas e matriz de riscos. Exigir seção de fontes, verificações realizadas, informações ausentes, recomendações e situação final.

## Regras de negócio / exceções

1. Dado ausente não é zero; coluna sem definição não recebe interpretação inventada.
2. Se fontes divergirem, evidenciar a divergência e usar `PENDENTE`, não escolher arbitrariamente.
3. Se análise exigir ação em terceiros, interromper antes da execução e documentar a aprovação necessária.
4. Decisão humana: Gestor comercial aprova preço/condições; cliente aceita e formaliza contrato.
5. Dados fictícios e reais nunca devem ser misturados sem rotulagem explícita.

## Entrada ilustrativa

> Execute WF_02 para tarefa SEN-DEMO-02, considerando [domínio], [período], [fontes] e [resultado requerido]. Mantenha a política global, gere handoffs quando ocorrer mudança de função e devolva um resultado revisável com estado.

**Arquivo/exemplo auxiliar:** `04_TEMPLATES/TEMPLATE_HANDOFF.md`.

## Aceite e teste de mesa

- O orquestrador identificou quais agentes eram necessários e por quê.
- Cada produto parcial contém fontes e premissas identificadas.
- As exceções e dependências aparecem sem afirmações falsas de execução.
- Há responsável humano para decisão com potencial impacto externo.
- A etapa de revisão registra pelo menos o que foi efetivamente verificado e o que permanece NÃO OBSERVADO.
