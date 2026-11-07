# Prompt mestre — Painel de gestão de projetos

**Uso:** criar um sistema web integrado de acompanhamento de projetos, planos de ação, matriz de riscos e atas de reunião.

## [PROPÓSITO]

Crie um **painel de gestão de projetos** simples de operar, visualmente organizado e funcional. Atue como analista de sistemas, gestor de projetos e desenvolvedor web. O sistema deve centralizar informações, acompanhar ações, avaliar riscos e gerar atas de reunião vinculadas aos projetos.

## [ENTRADAS]

Configure a solução com:

- **Organização ou equipe:** [informar].
- **Tipos de projetos acompanhados:** [informar].
- **Campos adicionais:** [informar ou utilizar os padrões abaixo].
- **Usuários previstos:** [uso individual local ou uso compartilhado].
- **Identidade visual:** [marca, cores e logotipo, se houver].
- **Tecnologia:** [padrão: HTML, CSS e JavaScript].
- **Armazenamento:** [padrão: local no navegador; integração externa somente quando solicitada].
- **Dados iniciais:** [anexar arquivos ou iniciar com cadastros vazios].

Não invente dados de projetos reais. Dados de demonstração, quando pedidos, devem ser identificados como **fictícios**.

## [DETALHES]

### 1. Visão geral e projetos

Permita cadastrar, editar, consultar e excluir projetos. Utilize, no mínimo: ID, nome, descrição, responsável, situação, início, prazo, progresso e observações. Mostre indicadores como total de projetos, ações pendentes, ações atrasadas e riscos abertos; calcule esses números a partir dos registros existentes.

### 2. Planos de ação

Permita vincular ações a cada projeto, com campos: ID, descrição, objetivo, responsável, data inicial, prazo, status, prioridade e evidência ou observação. Exiba tabela com busca e filtros e destaque atrasos a partir do prazo e status. Permita editar e concluir ações sem perder o histórico básico de atualização.

### 3. Matriz de riscos

Permita registrar riscos por projeto, incluindo: ID, descrição, causa, consequência, probabilidade, impacto, responsável, resposta planejada, prazo e status. Use uma **escala configurável de 1 a 5** para probabilidade e impacto e calcule `pontuação = probabilidade × impacto`.

Apresente a matriz visual 5×5 e uma lista de riscos. Defina e exiba claramente os limites das faixas de classificação (baixo, médio e alto); trate esses limites como **configuração de gestão**, não como padrão universal. Inclua ações de mitigação e acompanhamento.

### 4. Gerador de atas de reunião

Ofereça formulário com: projeto, título, data, horário, local ou modalidade, participantes, pauta, pontos discutidos, decisões, pendências, responsáveis e prazos. Gere uma **ata organizada e editável**, com numeração ou identificação, e permita visualizar, copiar, imprimir e exportar em Markdown ou formato compatível com impressão em PDF.

Decisões e encaminhamentos devem refletir somente o que foi registrado; nunca crie participantes, decisões ou prazos automaticamente. Permita transformar encaminhamentos em ações do projeto mediante confirmação do usuário.

### 5. Integração, interface e dados

- Crie navegação por **Visão geral | Projetos | Planos de ação | Riscos | Atas**.
- Relacione ações, riscos e atas ao projeto correto por identificadores estáveis.
- Inclua formulários com validação, mensagens de erro claras, confirmações antes de exclusões e estados vazios.
- Use visual responsivo, acessível, com tabelas, indicadores e gráficos simples quando úteis.
- Na versão sem servidor, salve os dados no `localStorage` e forneça **exportação/importação de backup em JSON**.
- Se o armazenamento for local, explique que os dados **não são sincronizados entre dispositivos ou usuários** e podem ser perdidos com a limpeza do navegador.
- Não simule autenticação, multiusuário, e-mails ou integração com sistemas externos como se estivessem ativos.

## [FORMATO]

Entregue a aplicação completa em **HTML, CSS e JavaScript**, com arquivos separados, estrutura de pastas, dados iniciais vazios, instruções de uso e orientações de backup. Todas as funções anunciadas na interface devem estar implementadas; funcionalidades dependentes de backend devem ser descritas como não disponíveis na versão local.

## [REVISÃO]

Teste, quando houver ambiente disponível: cadastro e edição de projetos, associação de ações e riscos, cálculo da matriz 5×5, identificação de atrasos, geração e exportação de atas, confirmação para exclusões, filtros, persistência após recarregar a página e restauração do backup. Revise layout em celular e desktop, legibilidade, validação de campos e consistência entre indicadores e registros. Liste os testes executados e as limitações encontradas.
