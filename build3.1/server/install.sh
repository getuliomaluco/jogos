#!/bin/bash
set -e

echo "== Instalando dependências (somente o necessário) =="

# 1) Python3
if ! command -v python3 >/dev/null 2>&1; then
  echo "[ERRO] python3 não encontrado. Instale via apt."
  exit 1
fi

# 2) pip
if ! command -v pip3 >/dev/null 2>&1; then
  echo "Instalando pip3..."
  sudo apt-get update -y
  sudo apt-get install -y python3-pip
fi

# 3) Ferramentas do sistema (xdotool é usado para mouse/teclado)
if ! command -v xdotool >/dev/null 2>&1; then
  echo "Instalando xdotool..."
  sudo apt-get update -y
  sudo apt-get install -y xdotool
else
  echo "✓ xdotool já instalado"
fi

# 4) Dependências Python
echo "Instalando libs Python (websockets, mss, Pillow)..."
pip3 install --user -r /home/getulio/build3.1/requirements.txt

echo "== OK =="
echo "Para testar:"
echo "  python3 /home/getulio/build3.1/server.py --port 8080 --verbose"
