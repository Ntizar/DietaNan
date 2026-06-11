#!/usr/bin/env bash
# Registro rápido de peso desde terminal
# Uso: ./peso.sh 96.5 "nota opcional"

PESO=$1
NOTAS="${2:-}"

if [ -z "$PESO" ]; then
  echo "Uso: ./peso.sh <kg> [notas]"
  echo "Ej: ./peso.sh 96.5"
  exit 1
fi

cd "$(dirname "$0")/.."
python3 scripts/registro.py peso "$PESO" "$NOTAS"