# Leitor de Arquivos

Aplicação em HTML, CSS e JavaScript para ler, dentro do navegador, os arquivos da pasta `arquivos/`.

## Como usar

1. Coloque os documentos dentro de `arquivos/`. Subpastas são aceitas.
2. Abra o projeto no VS Code e clique em **Go Live**, da extensão Live Server.
3. Abra a pasta `viewfiles` na página do Live Server. A lista é carregada sozinha.
4. Navegue pela árvore de pastas e selecione um arquivo para lê-lo. Use **Baixar arquivo** quando necessário.

## Publicação em servidor LAMP por FTP

1. Envie por FTP a pasta `viewfiles` inteira, incluindo `listar.php` e `arquivos/`.
2. Abra `viewfiles/index.html` pelo endereço do site. A lista é carregada sozinha pelo `listar.php`, que exige PHP 5.4 ou superior.
3. Para acrescentar documentos, envie-os para `arquivos/` por FTP. Eles aparecem na próxima vez que a página for aberta.

O Apache não precisa de configuração nem de listagem de pastas ligada.

**Atenção:** quem tiver o endereço pode ver e baixar todos os arquivos. Para documentos reais, proteja a pasta com senha no painel da hospedagem.

## Sem servidor

Por segurança, um navegador não deixa uma página listar pastas do disco sozinha. Ao abrir `index.html` com dois cliques, a página informa que não conseguiu ler a pasta. Não há seleção manual de pasta.

## Arquivos com visualização

- Markdown: `.md` e `.markdown`
- PDF: `.pdf`
- Word: `.docx`
- PowerPoint: `.pptx`

Os demais tipos aparecem na árvore e podem ser baixados, mas não têm visualização. Arquivos e pastas ocultos, cujo nome começa com ponto, não são listados.

## Observações

- Os arquivos são processados localmente no navegador; a aplicação não faz upload deles.
- PDF usa o visualizador nativo do navegador.
- DOCX e PPTX usam bibliotecas carregadas pela CDN do jsDelivr. Por isso, a prévia desses dois formatos requer conexão com a internet.
- A prévia de PPTX extrai e organiza o texto de cada slide. Elementos complexos, animações, fontes específicas e transições devem ser consultados no PowerPoint para fidelidade total.
