#!/usr/bin/env python3
"""Recria prompts/index.json a partir dos arquivos .md da pasta prompts/.

Uso: python3 atualizar_index.py

O título de cada prompt é o primeiro título "# ..." do arquivo; sem ele,
usa o nome do arquivo. O index.json é reescrito por inteiro a cada execução.
"""

import json
import re
import sys
from pathlib import Path

PASTA_PROMPTS = Path(__file__).resolve().parent / "prompts"
ARQUIVO_INDICE = PASTA_PROMPTS / "index.json"


def extrair_titulo(arquivo: Path) -> str:
    dentro_de_bloco_de_codigo = False
    for linha in arquivo.read_text(encoding="utf-8-sig").splitlines():
        if linha.startswith("```"):
            dentro_de_bloco_de_codigo = not dentro_de_bloco_de_codigo
            continue
        titulo = re.match(r"#\s+(.+)", linha)
        if titulo and not dentro_de_bloco_de_codigo:
            return titulo.group(1).strip()
    return arquivo.stem


def listar_prompts() -> list[dict[str, str]]:
    arquivos = sorted(
        arquivo
        for arquivo in PASTA_PROMPTS.rglob("*")
        if arquivo.is_file() and arquivo.suffix.lower() == ".md"
    )
    return [
        {
            "title": extrair_titulo(arquivo),
            "path": arquivo.relative_to(PASTA_PROMPTS).as_posix(),
        }
        for arquivo in arquivos
    ]


def main() -> int:
    if not PASTA_PROMPTS.is_dir():
        print(f"Pasta não encontrada: {PASTA_PROMPTS}", file=sys.stderr)
        return 1

    prompts = listar_prompts()
    conteudo = json.dumps({"prompts": prompts}, ensure_ascii=False, indent=2)
    ARQUIVO_INDICE.write_text(conteudo + "\n", encoding="utf-8")

    print(f"{ARQUIVO_INDICE.name} atualizado com {len(prompts)} prompt(s):")
    for prompt in prompts:
        print(f"  - {prompt['path']}: {prompt['title']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
