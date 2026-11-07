#!/usr/bin/env python3
"""Empacota cada skill de 60-skills/ em um .zip pronto para upload no claude.ai.

Uso: python tools/empacotar_skills.py [pasta_do_pacote]
Saída: dist/skills-claude/<name>.zip  (pasta interna = <name>, com SKILL.md na raiz)
Só usa a biblioteca padrão do Python.
"""
import re
import sys
import zipfile
from pathlib import Path


def main():
    raiz = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    destino = raiz / "dist" / "skills-claude"
    destino.mkdir(parents=True, exist_ok=True)
    total = 0
    for skill_md in sorted((raiz / "60-skills").glob("*/SKILL.md")):
        texto = skill_md.read_text(encoding="utf-8")
        m = re.search(r"^name:\s*([a-z0-9-]+)\s*$", texto, re.M)
        if not m:
            print(f"[pulado] {skill_md.relative_to(raiz)}: campo 'name' ausente ou inválido")
            continue
        nome = m.group(1)
        pasta = skill_md.parent
        zip_path = destino / f"{nome}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            for arquivo in sorted(pasta.rglob("*")):
                if arquivo.is_file():
                    z.write(arquivo, Path(nome) / arquivo.relative_to(pasta))
        print(f"[ok] {zip_path.relative_to(raiz)}")
        total += 1
    print(f"{total} skill(s) empacotada(s).")


if __name__ == "__main__":
    main()
