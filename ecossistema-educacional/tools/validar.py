#!/usr/bin/env python3
"""Valida um pacote de ecossistema de IA por prompts.

Uso:   python tools/validar.py [pasta_do_pacote]
Requer: PyYAML  ->  pip install pyyaml

Checa: ids únicos e com prefixo válido, arquivos existentes, cabeçalho igual ao
manifesto, ligações permitidas pela matriz de chamadas, recursos alcançáveis a
partir da raiz, seções obrigatórias, placeholders {{...}} esquecidos, fontes RAG
existentes, formato das skills e tamanho dos arquivos.
"""
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML não encontrado. Instale com: pip install pyyaml")

PREFIXOS = {
    "dom": "dominio", "orq": "orquestrador", "ma": "multiagentes", "ag": "agente",
    "sa": "subagente", "wf": "workflow", "sk": "skill", "rag": "rag",
}
PODE_USAR = {
    "dominio": {"orquestrador"},
    "orquestrador": {"agente", "multiagentes", "workflow"},
    "multiagentes": {"agente"},
    "workflow": {"agente", "multiagentes", "subagente", "skill"},
    "agente": {"subagente", "skill", "rag"},
    "subagente": set(), "skill": set(), "rag": set(),
}
SECOES = {
    "dominio": ["Mapa de roteamento", "Fronteira"],
    "orquestrador": ["Equipe disponível", "Checklist"],
    "multiagentes": ["Critério de consenso", "Rodadas máximas"],
    "agente": ["Recursos permitidos", "Formato de saída", "Limites"],
    "subagente": ["Saída:", "Exemplo"],
    "workflow": ["Portão", "Saída final"],
    "skill": ["Procedimento", "Checklist"],
    "rag": ["Regras de recuperação"],
}
LIMITE_CARACTERES = 7500
RE_ID = re.compile(r"^[a-z]+\.[a-z0-9]+(-[a-z0-9]+)*$")


def ler_cabecalho(texto):
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", texto, re.S)
    if not m:
        return None
    dados = yaml.safe_load(m.group(1)) or {}
    if "metadata" in dados and "id" not in dados:  # skill no formato SKILL.md
        meta = dict(dados["metadata"])
        meta["_skill_name"] = dados.get("name")
        meta["_skill_description"] = dados.get("description")
        meta.setdefault("usa", [])
        return meta
    return dados


def main():
    raiz = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    manifesto = raiz / "ecosystem.yaml"
    if not manifesto.exists():
        sys.exit(f"ecosystem.yaml não encontrado em {raiz}")
    man = yaml.safe_load(manifesto.read_text(encoding="utf-8"))
    erros, avisos = [], []

    recursos = {}
    for r in man.get("recursos", []):
        rid = r.get("id", "")
        if rid in recursos:
            erros.append(f"id duplicado: {rid}")
        if not RE_ID.match(rid):
            erros.append(f"id fora do padrão prefixo.nome-em-kebab: {rid}")
        recursos[rid] = r

    tipos = {}
    for rid in recursos:
        prefixo = rid.split(".")[0]
        if prefixo not in PREFIXOS:
            erros.append(f"{rid}: prefixo desconhecido '{prefixo}'")
        tipos[rid] = PREFIXOS.get(prefixo)

    raiz_id = man.get("raiz")
    if raiz_id not in recursos or tipos.get(raiz_id) != "dominio":
        erros.append(f"raiz '{raiz_id}' ausente ou não é um domínio")

    for rid, r in recursos.items():
        tipo = tipos[rid]
        caminho = raiz / r.get("arquivo", "")
        if not caminho.is_file():
            erros.append(f"{rid}: arquivo não encontrado ({r.get('arquivo')})")
            continue
        texto = caminho.read_text(encoding="utf-8")
        cab = ler_cabecalho(texto)
        if cab is None:
            erros.append(f"{rid}: sem cabeçalho YAML")
            continue
        if cab.get("id") != rid:
            erros.append(f"{rid}: id do cabeçalho é '{cab.get('id')}'")
        if cab.get("tipo") != tipo:
            erros.append(f"{rid}: tipo do cabeçalho '{cab.get('tipo')}' ≠ '{tipo}'")

        usa_man = set(r.get("usa") or [])
        usa_cab = set(cab.get("usa") or [])
        if usa_man != usa_cab:
            erros.append(f"{rid}: 'usa' difere do manifesto ({sorted(usa_cab)} vs {sorted(usa_man)})")
        for alvo in usa_man:
            if alvo not in recursos:
                erros.append(f"{rid}: usa '{alvo}', que não existe no manifesto")
            elif tipos[alvo] not in PODE_USAR.get(tipo, set()):
                erros.append(f"{rid} ({tipo}) não pode chamar {alvo} ({tipos[alvo]})")
            elif alvo not in texto.split("---", 2)[-1]:
                avisos.append(f"{rid}: '{alvo}' está no cabeçalho mas não aparece no corpo")

        pai = cab.get("pai")
        if pai and pai not in recursos:
            erros.append(f"{rid}: pai '{pai}' não existe")

        for secao in SECOES.get(tipo, []):
            if secao not in texto:
                erros.append(f"{rid}: falta a seção '{secao}'")
        if "{{" in texto:
            erros.append(f"{rid}: placeholder {{...}} não preenchido")
        if len(texto) > LIMITE_CARACTERES:
            avisos.append(f"{rid}: {len(texto)} caracteres (> {LIMITE_CARACTERES}); mova detalhes para references/ ou RAG")

        if tipo == "rag":
            fontes = cab.get("fontes") or []
            if not fontes:
                erros.append(f"{rid}: base RAG sem 'fontes'")
            for f in fontes:
                if not (raiz / f).is_file():
                    erros.append(f"{rid}: fonte não encontrada ({f})")
        if tipo == "skill":
            nome = cab.get("_skill_name") or ""
            desc = cab.get("_skill_description") or ""
            if not re.match(r"^[a-z0-9]+(-[a-z0-9]+)*$", nome) or len(nome) > 64:
                erros.append(f"{rid}: 'name' deve ser kebab-case com até 64 caracteres")
            if "claude" in nome or "anthropic" in nome:
                erros.append(f"{rid}: 'name' não pode conter 'claude' nem 'anthropic'")
            if not desc or len(desc) > 1024:
                erros.append(f"{rid}: 'description' vazia ou acima de 1024 caracteres")

    # Alcance a partir da raiz
    vistos, fila = set(), [raiz_id]
    while fila:
        atual = fila.pop()
        if atual in vistos or atual not in recursos:
            continue
        vistos.add(atual)
        fila.extend(recursos[atual].get("usa") or [])
    for rid in recursos:
        if rid not in vistos:
            erros.append(f"{rid}: não é alcançável a partir de {raiz_id}")

    contagem = {}
    for t in tipos.values():
        contagem[t] = contagem.get(t, 0) + 1
    print(f"Pacote: {man.get('nome')} v{man.get('versao')}  ({len(recursos)} recursos)")
    print("  " + " · ".join(f"{t}: {n}" for t, n in sorted(contagem.items())))
    for a in avisos:
        print(f"[aviso] {a}")
    for e in erros:
        print(f"[erro]  {e}")
    if erros:
        print(f"\nReprovado: {len(erros)} erro(s), {len(avisos)} aviso(s).")
        sys.exit(1)
    print(f"\nAprovado: 0 erros, {len(avisos)} aviso(s).")


if __name__ == "__main__":
    main()
