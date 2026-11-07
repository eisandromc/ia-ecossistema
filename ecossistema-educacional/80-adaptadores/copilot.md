---
id: adaptador.copilot
tipo: adaptador
nome: Adaptador Microsoft 365 Copilot (web)
versao: 1.0.0
---
# Adaptador — Microsoft 365 Copilot (web)

> Os nomes de menus mudam com frequência. Se um caminho não existir, procure a opção equivalente e ajuste este arquivo.

## Mapeamento

| Recurso | Onde vive no Copilot |
| --- | --- |
| Domínio | **Agente declarativo** "porta de entrada" no Agent Builder |
| Orquestradores | Agente declarativo dedicado (um por orquestrador) |
| Multiagentes | Agentes chamados com **@** no Copilot Chat, ou papel no Kernel |
| Agentes | Arquivos de conhecimento do agente do orquestrador (ou agente próprio) |
| Subagentes | Seção nas instruções do agente |
| Workflows | Roteiro no conhecimento; fluxos com gatilho exigem o Copilot Studio completo |
| Skills | Arquivos `SKILL.md` como conhecimento (skills personalizadas nativas estão em prévia) |
| RAG | Arquivos enviados, pastas e arquivos do OneDrive ou sites do SharePoint |

## Passo a passo (Modo Nativo)

1. **Publique as fontes** — coloque `70-rag/fontes/` e os arquivos de skills numa pasta do OneDrive ou SharePoint (ou anexe direto no agente).
2. **Agentes dos orquestradores** — no Copilot, vá em **Agentes > Novo agente > Configurar**, para cada `orq.*`:
   - **Nome / Descrição:** do cabeçalho e da Missão.
   - **Instruções:** conteúdo do orquestrador + protocolo resumido (veja o adaptador do ChatGPT). Há limite de caracteres (cerca de 8.000).
   - **Conhecimento:** arquivos dos agentes, workflows e skills que ele usa + fontes RAG.
   - **Iniciadores:** 4 pedidos típicos.
3. **Agente do domínio** — mesmo caminho; instruções do domínio + regra: "para executar, indique o agente do orquestrador com @".
4. **Compartilhe** os agentes com a equipe pelo menu de compartilhamento do agente.
5. **Teste:** rode os casos `[fumaça]` em cada agente.

## Bloco COLE AQUI — exemplo

```text
[COLE AQUI — Copilot · Agentes > Novo agente > Configurar]
Nome: Orquestrador Pedagógico
Descrição: Coordena planos de aula, materiais e avaliações alinhados ao plano de curso.
Instruções: (conteúdo de 10-orquestradores/orq.pedagogico.md, sem o cabeçalho YAML)
            + protocolo resumido
Conhecimento: 30-agentes/ag.planejador.md, ag.material.md, ag.avaliador.md,
              40-subagentes/*.md, 50-workflows/wf.semana-letiva.md,
              20-multiagentes/ma.conselho-revisor.md, 60-skills/*/SKILL.md,
              70-rag/fontes/*.md
Iniciadores: "Planeje a semana da turma 1A" · "Crie uma prova de 10 questões"
             · "Faça um roteiro de slides sobre listas" · "Revise este plano de aula"
```

## Observação

Fluxos que rodam sozinhos (gatilho por data, e-mail ou formulário) não cabem no Agent Builder: use **Copilot Studio** e reaproveite o arquivo do workflow como especificação dos passos.
