#!/usr/bin/env bash
# Registro rápido de comida desde terminal
# Uso: ./comida.sh <tipo> <descripcion> <kcal>
# Tipos: desayuno, almuerzo, comida, merienda, cena, postre, bebida, post-entreno

TIPO=$1
DESC=$2
KCAL=$3
PROT=${4:-0}
HID=${5:-0}
GRAS=${6:-0}

if [ -z "$TIPO" ] || [ -z "$DESC" ] || [ -z "$KCAL" ]; then
  echo "Uso: ./comida.sh <tipo> <descripcion> <kcal> [proteinas] [hidratos] [grasas]"
  echo "Ej: ./comida.sh cena '2 huevos fritos' 300 20 2 22"
  echo ""
  echo "Tipos: desayuno, almuerzo, comida, merienda, cena, postre, bebida, post-entreno"
  exit 1
fi

cd "$(dirname "$0")/.."
python3 scripts/registro.py comida "$TIPO" "$DESC" "$KCAL" "$PROT" "$HID" "$GRAS"