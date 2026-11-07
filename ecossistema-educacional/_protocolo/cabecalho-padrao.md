---
id: cabecalho-padrao
tipo: protocolo
nome: Cabeçalho padrão e convenções de id
versao: 1.0.0
---
# Cabeçalho padrão e convenções de id

## Cabeçalho YAML (todos os recursos, exceto skills)

```yaml
---
id: ag.planejador          # prefixo.nome-em-kebab-case, único no pacote
tipo: agente               # dominio | orquestrador | multiagentes | agente | subagente | workflow | skill | rag
nome: Planejador de Aula   # nome legível
versao: 1.0.0              # versionamento semântico
pai: orq.pedagogico        # quem é dono deste recurso na hierarquia (null para domínio e transversais)
usa: [sk.plano-aula, rag.plano-curso]   # ids que este recurso pode chamar ou consultar
plataformas: [claude, chatgpt, copilot]
---
```

RAG acrescenta `fontes: [70-rag/fontes/arquivo.md]`.

## Cabeçalho de Skill (formato nativo SKILL.md)

O Claude aceita poucos campos no topo de um SKILL.md. Por isso as skills usam `name` e `description` no topo e guardam os dados do ecossistema em `metadata`:

```yaml
---
name: plano-aula            # kebab-case; sem as palavras "claude" ou "anthropic"
description: Use ao ...     # 1 frase com os gatilhos de uso (até 1024 caracteres)
metadata:
  id: sk.plano-aula
  tipo: skill
  versao: "1.0.0"
---
```

## Prefixos e pastas

| Prefixo | Tipo | Pasta |
| --- | --- | --- |
| `dom.` | dominio | `00-dominio/` |
| `orq.` | orquestrador | `10-orquestradores/` |
| `ma.` | multiagentes | `20-multiagentes/` |
| `ag.` | agente | `30-agentes/` |
| `sa.` | subagente | `40-subagentes/` |
| `wf.` | workflow | `50-workflows/` |
| `sk.` | skill | `60-skills/<id>/SKILL.md` |
| `rag.` | rag | `70-rag/` (+ `70-rag/fontes/`) |

## Limites de tamanho

Cada arquivo de instruções deve ficar abaixo de **7.500 caracteres**, para caber nos campos de instrução de GPTs e de agentes do Copilot (cerca de 8.000 caracteres; confira o limite atual da plataforma). Passou disso: mova exemplos e tabelas para `references/` ou para uma fonte RAG.
