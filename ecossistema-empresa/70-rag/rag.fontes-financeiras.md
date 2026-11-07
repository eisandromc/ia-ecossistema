---
id: rag.fontes-financeiras
tipo: rag
nome: Referências Financeiras Fictícias
versao: 1.1.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# RAG — Fontes Financeiras Fictícias

## Escopo
Fonte de dados demonstrativa e leitura documental, **não é índice vetorial** e não possui serviço de busca conectado.

## Fonte local fornecida no pacote
- `75-exemplos/dados_financeiros_ficticios.csv` (dados simulados, conferir cabeçalhos).
- `75-exemplos/GABARITO_DADOS_FINANCEIROS.md` (gabarito para teste e revisão, não substituir o CSV como fonte primária).

## Protocolo de consulta manual
Ler a fonte autorizada, identificar linhas/campos exatos, citar caminho do arquivo e registrar lacunas.
Se não houver acesso ao arquivo, retornar PENDENTE. Nunca pressupor acesso ao ERP AllTech.
