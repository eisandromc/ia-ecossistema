---
id: wf.compras
tipo: workflow
nome: Compras e suprimentos
versao: 1.1.0
pai: orq.comercial-implantacao
usa:
- ag.compras-suprimentos
- sk.gate-aprovacao
plataformas:
- chatgpt
- claude
- copilot
---

# WF_03 — Comparação e aprovação de compras

**Categoria:** workflow lógico baseado em prompts  
**Status inicial:** PENDENTE  
**Orquestrador sugerido:** `ORQ_01_CORPORATIVO`; complementar `ORQ_02_COMERCIAL_IMPLANTACAO` quando houver ciclo de venda/implantação.  
**Agentes:** AG_05_COMPRAS_SUPRIMENTOS, AG_01_ANALISTA_NEGOCIOS, AG_12_QUALIDADE_COMPLIANCE.

## Objetivo e fronteira

Comparação e aprovação de compras. O fluxo representa um processo didático de análise e coordenação; **não aciona sistemas automaticamente**, não concede autorizações e não comprova práticas internas da AllTech.

## Pré-condições

- Objetivo e domínio identificados; fontes disponibilizadas com permissão.
- **Entrada:** requisição, critérios de seleção, propostas comparáveis de fornecedores, teto aprovado se houver.
- Dono da tarefa e ponto de decisão humana definidos.
- Requisitos de LGPD, acesso e confidencialidade revisados quando pertinentes.
- Resultado esperado: Quadro comparativo de propostas com custos totais, riscos e ressalvas.

## Passo a passo com handoffs

| Fase | Tarefa | Produto | Gate / exceção |
|---|---|---|---|
| 0. Receber | ORQ_01 recebe objetivo, permissões e arquivos | contrato de entrada | falta fonte essencial → PENDENTE |
| 1. Preparar | especialista primário confere formato e dados | inventário e dicionário | arquivo inconsistente → solicitar ajuste |
| 2. Analisar | especialista produz análise rastreável | tabela/relatório inicial | números sem fonte → BLOQUEADO para publicação |
| 3. Especializar | especialistas complementares tratam dependências | análises complementares | restrição legal ou técnica → consultar responsável |
| 4. Consolidar | ORQ_01 monta entregável único | Mapa de cotação e minuta de recomendação com justificativa | não transformar propostas em ações |
| 5. Revisar | AG_12 aplica checagens de qualidade | parecer e correções | falha crítica → BLOQUEADO |
| 6. Aprovar | responsável humano decide sobre uso e execução | decisão/aceite registrado | sem aceite → PENDENTE |

## Procedimento específico

Checar escopo equivalente; comparar tributos, frete, condições e prazo; não considerar menor preço como único critério; sinalizar falta de propostas. Para cada conclusão inclua fonte, período, transformação e limites.

## Saídas e evidências

**Artefatos:** Mapa de cotação e minuta de recomendação com justificativa. Exigir seção de fontes, verificações realizadas, informações ausentes, recomendações e situação final.

## Regras de negócio / exceções

1. Dado ausente não é zero; coluna sem definição não recebe interpretação inventada.
2. Se fontes divergirem, evidenciar a divergência e usar `PENDENTE`, não escolher arbitrariamente.
3. Se análise exigir ação em terceiros, interromper antes da execução e documentar a aprovação necessária.
4. Decisão humana: Alçada de compras ou gestor competente aprova a aquisição.
5. Dados fictícios e reais nunca devem ser misturados sem rotulagem explícita.

## Entrada ilustrativa

> Execute WF_03 para tarefa SEN-DEMO-03, considerando [domínio], [período], [fontes] e [resultado requerido]. Mantenha a política global, gere handoffs quando ocorrer mudança de função e devolva um resultado revisável com estado.

**Arquivo/exemplo auxiliar:** `85-templates/TEMPLATE_HANDOFF.md`.

## Aceite e teste de mesa

- O orquestrador identificou quais agentes eram necessários e por quê.
- Cada produto parcial contém fontes e premissas identificadas.
- As exceções e dependências aparecem sem afirmações falsas de execução.
- Há responsável humano para decisão com potencial impacto externo.
- A etapa de revisão registra pelo menos o que foi efetivamente verificado e o que permanece NÃO OBSERVADO.


## Encerramento operacional
Entregue evidências, responsáveis pelos gates e resultado como VALIDADO LOCALMENTE, PENDENTE ou BLOQUEADO conforme as verificações efetivamente realizadas.
