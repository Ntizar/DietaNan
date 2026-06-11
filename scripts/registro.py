#!/usr/bin/env python3
"""Registro rápido de peso en la base de datos de dieta."""
import json, sys, os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'database.json')

def cargar_db():
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def guardar_db(db):
    db['meta']['updated_at'] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def registrar_peso(peso_kg, notas=''):
    db = cargar_db()
    hoy = datetime.now().strftime('%Y-%m-%d')
    hora = 'mañana' if datetime.now().hour < 12 else 'tarde'
    db['peso'].append({
        'fecha': hoy,
        'hora': hora,
        'peso_kg': peso_kg,
        'notas': notas
    })
    guardar_db(db)
    print(f'✅ Peso registrado: {peso_kg} kg ({hoy} {hora})')
    # Actualizar peso actual en meta
    db['meta']['peso_actual_kg'] = peso_kg
    guardar_db(db)

def registrar_comida(tipo, descripcion, kcal, proteinas=0, hidratos=0, grasas=0, notas=''):
    db = cargar_db()
    hoy = datetime.now().strftime('%Y-%m-%d')
    ahora = datetime.now().strftime('%H:%M')
    db['comidas'].append({
        'fecha': hoy,
        'hora': ahora,
        'tipo': tipo,
        'descripcion': descripcion,
        'kcal': kcal,
        'proteinas_g': proteinas,
        'hidratos_g': hidratos,
        'grasas_g': grasas,
        'notas': notas
    })
    guardar_db(db)
    print(f'✅ Comida registrada: {tipo} — {descripcion} ({kcal} kcal)')

def registrar_deporte(descripcion, duracion_min, intensidad='media', kcal_estimadas=0, notas=''):
    db = cargar_db()
    hoy = datetime.now().strftime('%Y-%m-%d')
    ahora = datetime.now().strftime('%H:%M')
    db['deporte'].append({
        'fecha': hoy,
        'hora': ahora,
        'tipo': 'gimnasio',
        'descripcion': descripcion,
        'duracion_min': duracion_min,
        'intensidad': intensidad,
        'kcal_estimadas': kcal_estimadas,
        'notas': notas
    })
    guardar_db(db)
    print(f'✅ Entreno registrado: {descripcion} ({duracion_min} min, {intensidad})')

def registrar_pasos(pasos, notas=''):
    db = cargar_db()
    hoy = datetime.now().strftime('%Y-%m-%d')
    db['pasos'].append({
        'fecha': hoy,
        'pasos': pasos,
        'notas': notas
    })
    guardar_db(db)
    print(f'✅ Pasos registrados: {pasos}')

def resumen_hoy():
    db = cargar_db()
    hoy = datetime.now().strftime('%Y-%m-%d')
    comidas_hoy = [c for c in db['comidas'] if c['fecha'] == hoy]
    peso_hoy = [p for p in db['peso'] if p['fecha'] == hoy]
    deporte_hoy = [d for d in db['deporte'] if d['fecha'] == hoy]
    pasos_hoy = [p for p in db['pasos'] if p['fecha'] == hoy]

    print(f'\n📊 RESUMEN DEL DÍA — {hoy}')
    print('=' * 40)
    if peso_hoy:
        print(f'\n⚖️  Peso: {peso_hoy[-1]["peso_kg"]} kg')
    if comidas_hoy:
        total_kcal = sum(c['kcal'] for c in comidas_hoy)
        print(f'\n🍽️  Comidas ({len(comidas_hoy)}):')
        for c in comidas_hoy:
            print(f'   {c["hora"]} [{c["tipo"]}] {c["descripcion"]} — {c["kcal"]} kcal')
        print(f'   Total: {total_kcal} kcal')
    if deporte_hoy:
        print(f'\n🏋️  Deporte:')
        for d in deporte_hoy:
            print(f'   {d["descripcion"]} ({d["duracion_min"]} min)')
    if pasos_hoy:
        print(f'\n🚶  Pasos: {pasos_hoy[-1]["pasos"]}')
    print()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Uso:')
        print('  python3 registro.py peso <kg> [notas]')
        print('  python3 registro.py comida <tipo> <desc> <kcal> [proteinas] [hidratos] [grasas]')
        print('  python3 registro.py deporte <desc> <minutos> [intensidad] [kcal]')
        print('  python3 registro.py pasos <numero>')
        print('  python3 registro.py resumen')
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == 'peso':
        if len(sys.argv) < 3:
            print('Falta el peso')
            sys.exit(1)
        peso = float(sys.argv[2].replace(',', '.'))
        notas = sys.argv[3] if len(sys.argv) > 3 else ''
        registrar_peso(peso, notas)
    elif cmd == 'comida':
        if len(sys.argv) < 5:
            print('Faltan argumentos: comida <tipo> <desc> <kcal>')
            sys.exit(1)
        tipo = sys.argv[2]
        desc = sys.argv[3]
        kcal = int(sys.argv[4])
        prot = int(sys.argv[5]) if len(sys.argv) > 5 else 0
        hid = int(sys.argv[6]) if len(sys.argv) > 6 else 0
        gras = int(sys.argv[7]) if len(sys.argv) > 7 else 0
        registrar_comida(tipo, desc, kcal, prot, hid, gras)
    elif cmd == 'deporte':
        if len(sys.argv) < 4:
            print('Faltan argumentos: deporte <desc> <minutos>')
            sys.exit(1)
        desc = sys.argv[2]
        mins = int(sys.argv[3])
        intensidad = sys.argv[4] if len(sys.argv) > 4 else 'media'
        kcal = int(sys.argv[5]) if len(sys.argv) > 5 else 0
        registrar_deporte(desc, mins, intensidad, kcal)
    elif cmd == 'pasos':
        if len(sys.argv) < 3:
            print('Falta el número de pasos')
            sys.exit(1)
        registrar_pasos(int(sys.argv[2]))
    elif cmd == 'resumen':
        resumen_hoy()
    else:
        print(f'Comando desconocido: {cmd}')