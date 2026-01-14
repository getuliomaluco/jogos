#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$BASE_DIR/.." && pwd)"

RESTART=0
for arg in "$@"; do
  if [ "$arg" = "--restart" ] || [ "$arg" = "-r" ]; then
    RESTART=1
  fi
done

ENV_SRC="$ROOT_DIR/config.env"
SERVICE_SRC="$BASE_DIR/remote-control.service"

if [ ! -f "$ENV_SRC" ]; then
  echo "[ERRO] config.env nao encontrado em $ENV_SRC"
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "$ENV_SRC"
set +a

DEST_DIR="${RC_SERVER_PATH:-/home/getulio/build3.1}"
ENV_DST="$DEST_DIR/config.env"

echo "Copiando config.env -> $ENV_DST"
sudo mkdir -p "$DEST_DIR"
sudo cp "$ENV_SRC" "$ENV_DST"
sudo sed -i 's/\r$//' "$ENV_DST"

echo "Instalando service -> /etc/systemd/system/remote-control.service"
sudo cp "$SERVICE_SRC" /etc/systemd/system/remote-control.service
sudo sed -i 's/\r$//' /etc/systemd/system/remote-control.service

sudo systemctl daemon-reload
sudo systemctl enable remote-control.service

if [ "$RESTART" -eq 1 ]; then
  sudo systemctl restart remote-control.service
else
  echo "Service instalado. Para reiniciar manualmente:"
  echo "  sudo systemctl restart remote-control.service"
  echo "Ou rode com --restart para reiniciar automaticamente."
fi

echo "Status atual:"
systemctl --no-pager --full status remote-control.service
