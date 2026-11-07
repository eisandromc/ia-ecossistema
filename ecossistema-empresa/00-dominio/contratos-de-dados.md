# Contratos de dados e rastreabilidade

## Contrato de entrada — todas as tarefas

| Campo | Obrigatoriedade | Regra |
|---|---|---|
| `task_id` | obrigatória | identificador do trabalho, gerado para controle local |
| `objetivo` | obrigatória | verbo + objeto + resultado esperado |
| `dominio` | obrigatória | financeiro, comercial, HCM, projetos, compras, suporte, logística ou transversal |
| `periodo` | condicional | informar ciclo/períodos comparados se houver métricas |
| `fontes` | obrigatória | arquivos e fontes efetivamente disponíveis |
| `restricoes` | recomendada | confidencialidade, formato, prazo, escopo |
| `responsavel_aprovacao` | condicional | necessário para ações que alteram realidade |
| `criterio_aceite` | obrigatória | condição verificável de conclusão |

## Contrato de saída

```json
{
  "task_id": "SEN-DEMO-001",
  "agente": "AG_08_DADOS_BI",
  "status": "PENDENTE",
  "tipo_resultado": "analise",
  "fontes_utilizadas": ["dados_financeiros_ficticios.csv"],
  "fatos_e_calculos": [],
  "inferencias": [],
  "pendencias": [],
  "riscos": [],
  "recomendacoes": [],
  "acoes_externas_executadas": false,
  "aprovacao_humana_requerida": true
}
```

O JSON é **exemplo ilustrativo**, não um schema validado por integração. O campo `acoes_externas_executadas` deve permanecer `false` em uso puramente conversacional.

## Regras numéricas

- Moeda brasileira: informar unidade R$, normalizar separadores decimais.
- % variação: `(valor_atual - valor_anterior)/valor_anterior * 100`, salvo base anterior zero, em que o percentual fica **indefinido**.
- Margem: explicitar se `margem_bruta = (receita - custos_diretos)/receita` ou outra fórmula acordada.
- Faturado ≠ recebido; inadimplência não se infere apenas de saldo em aberto sem vencimentos.
- Conferir duplicidade por identificador e período; checar nulos, datas, sinais e reconciliação de totais.
- Não comparar períodos não equivalentes sem ressalva.

## Proveniência mínima

Toda conclusão material deve registrar: `arquivo`, `aba/tabela` se houver, `coluna/linha/ID`, `periodo`, `transformacao`, `agente_revisor` e `observacao`.

## Portões para dados sensíveis

1. Fonte legal e finalidade autorizada identificadas.
2. Dados mínimos; preferir agregação ou anonimização.
3. Acesso restrito e retenção definida pelo controlador.
4. Revisão de segurança e compliance quando necessário.
5. Nenhuma exportação para terceiro sem autorização.
