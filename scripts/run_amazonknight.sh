#!/bin/bash

BOT_DIR="$HOME/Tibia"
VENV_DIR="$BOT_DIR/venv"

echo "⚔️  AMAZONKNIGHT - Iniciando..."

# --- Verifica se o venv existe ---
if [ ! -d "$VENV_DIR" ]; then
    echo "❌ Ambiente virtual não encontrado!"
    echo "Criando venv em: $VENV_DIR"
    python3 -m venv "$VENV_DIR"
fi

# --- Ativa o ambiente virtual ---
source "$VENV_DIR/bin/activate"

# --- Handler para Ctrl+C ---
trap "echo '🛑 Encerrando...'; deactivate; exit 0" SIGINT

echo "🚀 Rodando amazonknight.py dentro do venv..."
python "$BOT_DIR/amazonknight.py"

# --- Finalização limpa ---
deactivate
echo "👋 AMAZONKNIGHT encerrado!"
