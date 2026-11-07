# Ecossistema de IA por Prompts — Pacote v1.0.0

Kit para construir e instalar ecossistemas de IA — **Domínio, Orquestradores, Multiagentes, Agentes, Subagentes, Workflows, Skills e RAG** — no Claude, no ChatGPT e no Microsoft 365 Copilot, direto pela interface web. Inclui um ecossistema de exemplo completo (domínio **Educação**) pronto para instalar.

## Começar

### Caminho A — Instalar o exemplo Educação (5 minutos)

1. Abra uma conversa nova (ou um projeto) no Claude, ChatGPT ou Copilot.
2. Anexe o arquivo `dist/ecossistema-completo.md` (arquivo único com tudo) — ou o `.zip` inteiro, se a plataforma descompacta arquivos.
3. Cole o conteúdo de `INSTALL.md` e envie.
4. Escolha **Kernel** (roda na hora, na conversa) ou **Nativo** (gera o passo a passo para configurar projeto, GPTs, agentes e skills).

### Caminho B — Criar o seu próprio ecossistema

1. Abra uma conversa nova e anexe `_templates/` e `_protocolo/` (ou o `.zip`).
2. Cole o conteúdo de `FABRICA.md`.
3. Responda à entrevista, aprove o organograma e receba o pacote gerado.
4. Instale o pacote com o `INSTALL.md` dele (Caminho A).

> **Dica — persistência:** para o Modo Kernel valer em todas as conversas, crie um *Projeto* (Claude ou ChatGPT), suba os arquivos no conhecimento do projeto e cole o `INSTALL.md` nas instruções do projeto.

## Estrutura

```text
ecossistema-ia-prompts/
├── README.md                 # este guia
├── FABRICA.md                # metaprompt que entrevista e GERA ecossistemas
├── INSTALL.md                # Prompt Instalador (Kernel ou Nativo)
├── ecosystem.yaml            # manifesto do exemplo Educação
├── CHANGELOG.md
├── _protocolo/               # regras comuns a todos os recursos
│   ├── protocolo.md          # HANDOFF, RETORNO, Quadro de Estado, roteamento
│   └── cabecalho-padrao.md   # cabeçalho YAML e convenções de id
├── _templates/               # esqueletos em branco dos 8 recursos
├── 00-dominio/               # dom.*  — orquestrador-raiz
├── 10-orquestradores/        # orq.*  — gerentes de linha de trabalho
├── 20-multiagentes/          # ma.*   — equipes com moderador
├── 30-agentes/               # ag.*   — especialistas
├── 40-subagentes/            # sa.*   — micro-tarefas
├── 50-workflows/             # wf.*   — roteiros fixos com portões
├── 60-skills/                # sk.*   — SKILL.md (formato nativo do Claude)
├── 70-rag/                   # rag.*  — bases de conhecimento + fontes/
├── 80-adaptadores/           # como instalar em cada plataforma
├── 90-testes/                # casos de teste
├── tools/                    # scripts opcionais (Python 3)
└── dist/                     # gerados: arquivo único e skills em .zip
```

## Hierarquia

```text
dom.educacao  (Domínio — só roteia)
├── orq.pedagogico
│   ├── ag.planejador ──── usa sk.plano-aula · rag.plano-curso
│   ├── ag.material ────── usa sa.revisor · rag.plano-curso
│   ├── ag.avaliador ───── usa sk.rubrica · sa.questoes · rag.plano-curso
│   ├── ma.conselho-revisor (ag.planejador + ag.avaliador)
│   └── wf.semana-letiva   (planejar → materiais → avaliação → revisão)
└── orq.gestao-escolar
    ├── ag.comunicados ─── usa sa.revisor · rag.regimento
    └── ag.indicadores
```

## Convenções

| Prefixo | Recurso | Pode chamar |
| --- | --- | --- |
| `dom.` | Domínio | orquestradores |
| `orq.` | Orquestrador | agentes, multiagentes, workflows |
| `ma.` | Multiagentes | agentes |
| `wf.` | Workflow | agentes, multiagentes, subagentes, skills |
| `ag.` | Agente | subagentes, skills, RAG |
| `sa.` | Subagente | ninguém |
| `sk.` | Skill | ninguém (é consultada) |
| `rag.` | RAG | ninguém (é consultada) |

Todo arquivo começa com o cabeçalho YAML padrão (`_protocolo/cabecalho-padrao.md`). Recursos conversam por envelopes `HANDOFF` e `RETORNO` (`_protocolo/protocolo.md`).

## Ferramentas (opcional, para quem tem Python 3)

```bash
pip install pyyaml
python tools/validar.py .               # checa ids, ligações, seções e fontes
python tools/empacotar_skills.py .      # gera dist/skills-claude/*.zip
python tools/gerar_arquivo_unico.py .   # gera dist/ecossistema-completo.md
```

Sem Python, a própria Fábrica e o Instalador fazem essas checagens dentro da conversa.

## Adaptar o exemplo

1. Troque os arquivos em `70-rag/fontes/` pelos documentos reais (os atuais são **fictícios**).
2. Ajuste regras e glossário em `00-dominio/dom.educacao.md`.
3. Rode `tools/validar.py` e regenere o `dist/`.
4. Suba a versão no `ecosystem.yaml` e registre no `CHANGELOG.md`.
