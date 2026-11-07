# Como contribuir

## Antes de abrir um Pull Request

1. Crie uma branch a partir de `develop`.
2. Use um prefixo permitido: `feature/`, `fix/`, `docs/`, `chore/`, `refactor/`, `security/` ou `hotfix/`.
3. Faça alterações pequenas, rastreáveis e relacionadas a um único objetivo.
4. Execute a validação aplicável ao componente alterado.
5. Não inclua credenciais, arquivos `.env`, dados pessoais ou fontes sem autorização.

## Fluxo de promoção

```text
branch de trabalho -> develop -> test -> main
```

- `develop`: integração das alterações de trabalho.
- `test`: validação e homologação.
- `main`: versão estável.

Os workflows e rulesets do GitHub devem bloquear caminhos de promoção diferentes desse fluxo.

## Painel

Para alterações em `painel/`:

```bash
cd painel
npm ci
npm test
npm run verificar
```

## Pull Requests

Explique o objetivo, os impactos, as validações realizadas e quaisquer limitações. Mantenha a discussão resolvida antes do merge.
