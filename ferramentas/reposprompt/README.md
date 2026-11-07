# Prompt Listador

Aplicação estática para leitura de arquivos de prompt localizados exclusivamente na pasta `prompts/`.

## Como usar

1. Coloque os seus arquivos Markdown dentro da pasta `prompts/`.
2. Execute `python3 atualizar_index.py` para recriar `prompts/index.json` com todos os arquivos `.md` da pasta. O título vem do primeiro `# título` de cada arquivo.
3. Execute o projeto por um servidor local ou publique-o em hospedagem estática. O navegador precisa de um servidor para carregar os arquivos da pasta automaticamente.
4. Abra `index.html` e clique em um prompt para alternar entre **Código Markdown** e **Visualização**.

## Recursos

- Usa uma única pasta fixa: `prompts/`.
- Lista apenas os arquivos declarados em `prompts/index.json`.
- Mostra código Markdown com cores para títulos, listas, citações, ênfases, links e blocos de código.
- Renderiza uma visualização de Markdown com títulos, listas, citações, links e blocos de código.
- Busca por nome e caminho de arquivo.
- Copia o conteúdo do prompt.
- Permite ajustar a fonte e alternar entre temas claro e escuro.

## Estrutura

- `index.html`: estrutura da aplicação.
- `style.css`: estilos responsivos.
- `script.js`: carregamento da biblioteca, código colorido e pré-visualização.
- `prompts/`: biblioteca única de prompts.
- `prompts/index.json`: índice dos prompts exibidos, gerado por `atualizar_index.py`.
- `atualizar_index.py`: atualiza o índice a partir dos arquivos Markdown.
