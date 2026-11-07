# Caso prático — implantação de componentes (cenário fictício)

## Situação

O **Cliente Aurora** deseja implantar três componentes em um sistema fictício de gestão: cadastro de contratos, aprovação de compras e painel de indicadores. Esta narrativa não retrata projetos ou produtos efetivos da AllTech.

## Premissas para o exercício (não aprovadas)

- Janela de execução: a definir.
- Equipes: analista de negócios, desenvolvedor, testador, administrador de infraestrutura, responsável do cliente.
- Componentes: `MOD-CONT`, `MOD-COMP`, `MOD-DASH`.
- Dependências: `MOD-DASH` depende de dados consistentes; `MOD-COMP` depende de regras de alçada formalizadas.
- Restrições: sem acesso a produção, sem valores de contrato e sem integração técnica definida.

## Prompt pronto

> Aplique ORQ_02 e WF_04. Use AG_01 para especificar requisitos e critérios de aceite, AG_09 para decompor o trabalho e planejar dependências, AG_10 para revisar acesso e AG_12 para criar um gate de homologação. Entregue uma EAP, matriz RACI, matriz de riscos, testes propostos e plano de reversão. Não declare que o software foi construído ou implantado.

## Itens mínimos para verificação

| Componente | Critério proposto | Evidência requerida para marcar testado |
|---|---|---|
| MOD-CONT | consistência de contratos | relatório de casos executados |
| MOD-COMP | regra de aprovação definida | casos de alçada com decisão assinada |
| MOD-DASH | totais reconciliam com fonte | consulta e resultado replicável |

## Aprovação

Somente gestor técnico e responsável do cliente podem autorizar a progressão para o ambiente real. Até então, status **PENDENTE**.
