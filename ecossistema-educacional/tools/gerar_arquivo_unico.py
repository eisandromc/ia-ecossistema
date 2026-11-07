#!/usr/bin/env python3
"""Gera dist/ecossistema-completo.md: o pacote inteiro em um único arquivo,
para anexar em plataformas que não descompactam .zip.

Uso: python tools/gerar_arquivo_unico.py [pasta_do_pacote]
Ordem: manifesto, protocolo, recursos na ordem do manifesto, references das
skills, fontes RAG, adaptadores e testes. Só usa a biblioteca padrão.
"""
import re
import sys
from pathlib import Path

SEPARADOR = "===== ARQUIVO: {} ====="


def main():
    raiz = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    manifesto = (raiz / "ecosystem.yaml").read_text(encoding="utf-8")
    ordem = ["ecosystem.yaml", "_protocolo/protocolo.md", "_protocolo/cabecalho-padrao.md"]
    ordem += re.findall(r"^\s*arquivo:\s*(\S+)", manifesto, re.M)
    ordem += sorted(str(p.relative_to(raiz)) for p in (raiz / "60-skills").glob("*/references/*.md"))
    ordem += sorted(str(p.relative_to(raiz)) for p in (raiz / "70-rag" / "fontes").glob("*.md"))
    ordem += sorted(str(p.relative_to(raiz)) for p in (raiz / "80-adaptadores").glob("*.md"))
    ordem += ["90-testes/casos.md"]

    nome = re.search(r"^nome:\s*(.+)$", manifesto, re.M).group(1).strip()
    versao = re.search(r"^versao:\s*(\S+)", manifesto, re.M).group(1)
    partes = [
        f"# {nome} v{versao} — pacote em arquivo único\n",
        "Este arquivo contém todos os arquivos do ecossistema. Cada um começa com a linha",
        "`===== ARQUIVO: <caminho> =====`. Para instalar, anexe este arquivo e cole o INSTALL.md.\n",
        "## Índice\n",
    ]
    partes += [f"- {c}" for c in ordem]
    for caminho in ordem:
        arquivo = raiz / caminho
        if not arquivo.is_file():
            print(f"[aviso] não encontrado: {caminho}")
            continue
        partes += ["", SEPARADOR.format(caminho), arquivo.read_text(encoding="utf-8").rstrip()]

    destino = raiz / "dist" / "ecossistema-completo.md"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text("\n".join(partes) + "\n", encoding="utf-8")
    print(f"[ok] {destino.relative_to(raiz)} ({len(ordem)} arquivos)")


if __name__ == "__main__":
    main()
