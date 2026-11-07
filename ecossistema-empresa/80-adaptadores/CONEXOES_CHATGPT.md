# Adaptação das ações para conectores ChatGPT

## O que está ativo e o que não está

Na sessão que originou o pacote v1.2.0, a consulta read-only de perfil do **Google Drive** e a consulta read-only de login no **GitHub** obtiveram resposta. Não foi realizada operação de gravação ou acesso a arquivos privados. O Gmail não estava instalado/conectado e exige ação do usuário. Essas verificações **não garantem** disponibilidade em outra sessão.

## Como invocar ações genuínas

- O assistente que executa a tarefa deve conferir a disponibilidade de ferramentas na sessão e escolher a ação real de catálogo pertinente.
- O arquivo `80-adaptadores/acoes-integracoes.yaml` contém **mapeamento descritivo** para ações cuja existência foi observada. O loader local não passa a ter essas ferramentas só por carregar o YAML.
- Operações de leitura: usar escopos/IDs reais e retornar referências identificadas; não copiar segredos.
- Operações de escrita: prévia + aprovação explícita + ferramenta concreta + verificação de retorno.
- Gmail: conectar o plugin Gmail em ChatGPT; depois confirmar o catálogo real e os métodos de buscar, ler, rascunhar e responder. Não assumir nomes das funções.
- GitHub Projects v2: o catálogo atual de ações GitHub cobre repositórios, Issues e PRs; **não comprova acesso direto aos quadros Projects v2**.

## Aplicação local

O caminho `ECOSSISTEMA_DIR` identifica a pasta de configuração, **não autentica** Google Drive, Gmail ou GitHub. Um aplicativo próprio precisaria de um backend/adaptador com OAuth por provedor, escopos mínimos, armazenamento protegido de credenciais, autorização pelo usuário, tratamento de expiração, paginação, auditoria, retries idempotentes, verificação do retorno e controle de acesso. **Nenhum desses componentes locais foi instalado pelo ZIP.**

Não copie tokens OAuth, cookies ou credenciais dos plugins conectados no ChatGPT para arquivos locais. O pacote deve ser executado em ambiente que possua os conectores ou adaptadores oficiais configurados separadamente.

## Protocolo obrigatório de prévia

```yaml
solicitacao: SEN-2026-EXEMPLO
provedor: google_drive  # google_drive | gmail | github
operacao: criar_arquivo
conta_ou_repositorio: confirmar_na_sessao
alvo: confirmar_id_real
conteudo_final_ou_diff: anexar_preview
fonte_e_justificativa: documentos_autorizados
aprovacao_humana: pendente
status: PENDENTE
```

## Diferença de conexão

| Plataforma | Situação do pacote |
|---|---|
| ChatGPT com Drive/GitHub | Pode orientar ferramentas realmente conectadas na sessão |
| ChatGPT com Gmail | Requer instalação/conexão prévia e verificação das ações |
| ChatGPT sem ferramentas | Apenas planejamento ou rascunhos sobre conteúdo fornecido |
| App local `ia-ecossistema` | Requer implementação/autenticação própria; não herda conexões ChatGPT |
| Claude/Copilot | Requer conectores e permissões próprios, sem transferência de credenciais |
