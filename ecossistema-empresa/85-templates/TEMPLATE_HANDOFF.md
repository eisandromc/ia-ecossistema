# Template de handoff entre papéis lógicos

```yaml
task_id: "[SEN-DEMO-NNN]"
agente_origem: "[AG_NN]"
agente_destino: "[AG_NN ou ORQ_NN]"
objetivo: "[ação específica]"
entradas:
  - arquivo: "[nome]"
    recorte: "[linhas, abas, período]"
fontes_utilizadas:
  - "[identificador verificável]"
resultados:
  - "[resultado derivado com método]"
limites:
  - "[não verificado / hipótese]"
pendencias:
  - "[dado faltante ou aprovação]"
status: "PENDENTE"
aprovacao_requerida: true
proxima_acao: "[responsável e entrega]"
```

**Observação:** o YAML é conteúdo para ser copiado ou adaptado, não envio automático para outro agente. Identificadores ou dados sensíveis devem ser eliminados ou substituídos por referências seguras.
