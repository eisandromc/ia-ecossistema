# Modelo 01 — Estrutura Neutra de Ecossistema de IA

Este pacote é um esqueleto sem domínio pré-definido. Ele cria apenas contratos e campos de personalização para Domínio, Orquestrador, Multiagentes, Agente, Subagente, Workflow, Skill, RAG e Ação/Ferramenta.

## Como personalizar

1. Preencha `ecosystem.yaml` e defina a pessoa responsável.
2. Use `PROMPT_CONSTRUTOR.md` em uma LLM para entrevistar o responsável e gerar os recursos específicos.
3. Preencha os arquivos em `templates/`, mantendo o cabeçalho YAML de cada recurso.
4. Execute `90-testes/casos-de-ouro.md` e a matriz de `governanca/gates.md` antes de configurar qualquer plataforma.

## Estados operacionais

- `ATIVO`: observado no ambiente-alvo.
- `VALIDADO LOCALMENTE`: contrato ou teste validado fora do ambiente-alvo.
- `PENDENTE`: falta trabalho ou evidência.
- `BLOQUEADO`: há impedimento identificado.
- `NÃO OBSERVADO`: não existe evidência direta.

Não há domínio, fonte, integração, credencial ou capacidade nativa presumidos neste modelo.
