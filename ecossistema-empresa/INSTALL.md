# Prompt Instalador — Ecossistema Empresarial AllTech

## Compatibilidade
Este pacote foi organizado segundo o **modelo de manifesto `ecosystem.yaml`** do material de planejamento do ecossistema.
A compatibilidade com o aplicativo local específico é **NÃO OBSERVADA**, pois seu código de carregamento não foi disponibilizado.

## Instalação na pasta solicitada pelo carregador
1. Faça backup do diretório existente, se houver.
2. Extraia o ZIP no diretório `~/Documents/ia-ecossistema/`, preservando o nome `ecossistema-empresa`.
3. Confirme que existe `~/Documents/ia-ecossistema/ecossistema-empresa/ecosystem.yaml`.
4. Configure `ECOSSISTEMA_DIR` no `.env` com o caminho **absoluto** dessa pasta, se o aplicativo depender dele.
5. Execute `python3 90-testes/validar_ecossistema.py` após instalar PyYAML, ou confira manualmente as referências.
6. Reinicie o processo do carregador, se ele não reler a configuração automaticamente.

## Prompt para a interface de IA
Você receberá o pacote `ecosystem.yaml` e arquivos Markdown. Leia primeiro o manifesto, confira IDs, referências e arquivos.
Identifique a plataforma (ChatGPT, Claude, Copilot) e escolha entre simulação de papéis na conversa e instruções de configuração nativa.
Registre domínio, orquestradores, multiagentes, agentes, subagentes, workflows, skills e RAG documental.
Apresente `/mapa`, `/status` e o contrato de entrada. Selecione apenas recursos indicados no manifesto.
Execute os casos de `90-testes/casos.md` com dados fictícios. Reporte como *configurado*, *simulado* e *não aplicado*,
sem inventar execuções de agentes independentes, integrações ou conexões com AllTech.

## Limites
As configurações não habilitam API, ERP, CRM, HCM, persistência, RAG indexado nem agentes autônomos.
São materiais educacionais não oficiais, sem afiliação ou homologação da AllTech.

## Configuração das integrações — v1.2.0

1. O `ecosystem.yaml` continua na raiz `ecossistema-empresa/`.
2. As ações são descritas em `80-adaptadores/acoes-integracoes.yaml`. Elas somente podem ser chamadas quando o ambiente em que o agente opera oferece a ferramenta real.
3. No ChatGPT, verifique o Google Drive e o GitHub conectados e habilitados **na conversa atual**; conecte o Gmail para pesquisar/responder mensagens.
4. Faça qualquer teste de gravação exclusivamente após confirmar destino e conteúdo; não execute testes destrutivos.
5. No terminal, execute `python3 90-testes/validar_ecossistema.py` e `python3 90-testes/validar_integracoes.py` (requer PyYAML).
6. No aplicativo local, o `ECOSSISTEMA_DIR` só define o diretório da configuração. A execução das ações demanda adaptador local OAuth/SDK independente. **Não copie tokens do ChatGPT para o `.env`.**
