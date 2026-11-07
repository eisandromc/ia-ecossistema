<?php
// Devolve em JSON os arquivos de arquivos/, para o leitor montar a árvore.
// A pasta é fixa e nada vem da requisição. Itens ocultos e links ficam de fora.

function listar($pasta, $prefixo = '')
{
    $itens = array();
    foreach (scandir($pasta) as $nome) {
        $caminho = $pasta . '/' . $nome;
        if ($nome[0] === '.' || is_link($caminho)) {
            continue;
        }
        if (is_dir($caminho)) {
            $itens = array_merge($itens, listar($caminho, $prefixo . $nome . '/'));
        } else {
            $itens[] = $prefixo . $nome;
        }
    }
    return $itens;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$raiz = __DIR__ . '/arquivos';
if (!is_dir($raiz)) {
    http_response_code(404);
    echo '{"erro":"Pasta arquivos/ não encontrada."}';
    exit;
}

echo json_encode(array('arquivos' => listar($raiz)), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
