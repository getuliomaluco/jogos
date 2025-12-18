#!/usr/bin/env bash

set -e

echo "🔧 Tibia Market RPA — Setup"

# Verifica Python
if ! command -v python3 &> /dev/null; then
  echo "❌ Python3 não encontrado"
  exit 1
fi

# Verifica pip
if ! command -v pip3 &> /dev/null; then
  echo "❌ pip3 não encontrado"
  exit 1
fi

# Verifica xdotool
if ! command -v xdotool &> /dev/null; then
  echo "❌ xdotool não encontrado. Instale com:"
  echo "   sudo apt install xdotool"
  exit 1
fi

# Verifica xclip
if ! command -v xclip &> /dev/null; then
  echo "❌ xclip não encontrado. Instale com:"
  echo "   sudo apt install xclip"
  exit 1
fi

echo "📦 Instalando dependências Python..."
pip3 install -r requirements.txt

echo "✅ Setup concluído com sucesso"
