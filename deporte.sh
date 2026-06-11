#!/usr/bin/env bash
# Registro rápido de deporte desde terminal
# Uso: ./deporte.sh <descripcion> <minutos> [intensidad] [kcal]

DESC=$1
MINS=$2
INTENSIDAD=${3:-media}
KCAL=${4:-0}

if [ -z "$DESC" ] || [ -z "$MINS" ]; then
  echo "Uso: ./deporte.sh <descripcion> <minutos> [intensidad] [kcal]"
  echo "Ej: ./deporte.sh 'Pierna+Pecho+Hombro' 45 alta 350"
  echo "Intensidades: baja, media, alta"
  exit 1
fi

cd "$(dirname "$0")/.."
python3 scripts/registro.py deporte "$DESC" "$MINS" "$INTENSIDAD" "$KCAL"