#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== Instalando dependencias (somente o necessario) =="

# 1) Python3
if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERRO] python3 nao encontrado. Instale via apt."
  exit 1
fi

# 2) pip
if ! command -v pip3 >/dev/null 2>&1; then
  echo "Instalando pip3..."
  sudo apt-get update -y
  sudo apt-get install -y python3-pip
fi

# 3) Ferramentas do sistema (xdotool e usado para mouse/teclado)
if ! command -v xdotool >/dev/null 2>&1; then
  echo "Instalando xdotool..."
  sudo apt-get update -y
  sudo apt-get install -y xdotool
else
  echo "xdotool ja instalado"
fi

# 4) Dependencias Python
echo "Instalando libs Python (websockets, mss, Pillow)..."
pip3 install --user -r "$BASE_DIR/requirements.txt"

echo "== OK =="
echo "Para testar:"
echo "  python3 \"$BASE_DIR/server.py\" --port 8080 --verbose"
