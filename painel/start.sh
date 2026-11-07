#!/usr/bin/env bash
# Inicia o painel. Antes, mostra se é preciso instalar os módulos do Node.
#   ./start.sh            verifica, instala se você confirmar e inicia
#   ./start.sh --check    só mostra a verificação, sem instalar nem iniciar
#   ./start.sh --install  reinstala os módulos e inicia
set -u
cd "$(dirname "$0")" || exit 1

MODO="${1:-}"
case "$MODO" in
  ""|--check|-c|--install|-i) ;;
  -h|--help)
    sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  *)
    echo "Opção desconhecida: $MODO (use --check, --install ou --help)"
    exit 1
    ;;
esac

if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Node.js não encontrado. Instale a versão 20 ou mais nova em https://nodejs.org"
  echo
  exit 1
fi

instalar() {
  echo "  Instalando os módulos do Node..."
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
}

if [ "$MODO" = "--check" ] || [ "$MODO" = "-c" ]; then
  node scripts/verificar.js
  CODIGO=$?
  [ "$CODIGO" -eq 2 ] && echo "  Rode ./start.sh para instalar e iniciar." && echo
  exit "$CODIGO"
fi

node scripts/verificar.js --criar-env
CODIGO=$?
[ "$CODIGO" -eq 1 ] && exit 1

if [ "$MODO" = "--install" ] || [ "$MODO" = "-i" ]; then
  instalar || exit 1
elif [ "$CODIGO" -eq 2 ]; then
  RESPOSTA="s"
  if [ -t 0 ]; then
    printf "  Instalar os módulos agora? [S/n] "
    read -r RESPOSTA
  fi
  case "$RESPOSTA" in
    n|N|nao|não) echo "  Instalação cancelada. O painel precisa dos módulos para iniciar."; exit 0 ;;
  esac
  instalar || exit 1
fi

exec node server.js --abrir
