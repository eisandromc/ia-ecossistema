---
id: sk.conector-drive
tipo: skill
nome: Operação via Google Drive
versao: 1.2.0
pai: dom.empresa-alltech
usa: []
plataformas:
- chatgpt
- claude
- copilot
---

# Skill — Google Drive, leitura e gravação com segurança

## Disponibilidade

Requer conector Google Drive na sessão atual. **Não é um cliente OAuth local** e não exige tokens no `.env`.

## Métodos de leitura

1. `mcp__Google_Drive__search`: busca de arquivo/pasta.
2. `mcp__Google_Drive__get_file_metadata`: resolução do ID, proprietário, tipo e diretório.
3. `mcp__Google_Drive__fetch`: leitura do arquivo conhecido.
4. `mcp__Google_Drive__list_folder`: listagem do diretório autorizado.

## Métodos de escrita com aceite

1. `mcp__Google_Drive__create_folder`: criar diretório.
2. `mcp__Google_Drive__upload_file`: upload de `file_uri` autenticado.
3. `mcp__Google_Drive__update_file`: atualizar metadados, destino ou bytes de arquivo não nativo.
4. Docs/Sheets/Slides: ações específicas para conteúdo nativo.

## Contrato mínimo

`provedor`, `recurso_id`, `operacao`, `entrada_autorizada`, `destino`, `aprovacao_especifica`, `ferramenta_real`, `resultado_observado`, `estado`.

Jamais carregar arquivos privados fora do escopo. URLs, IDs e metadados devem vir do conector, não de suposições. Em consultas paginadas, indicar quando houver resultados parciais.
