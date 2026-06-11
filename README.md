# FitTrack — Tu Dashboard de Dieta con IA

> Un sistema completo de seguimiento de peso, comidas, deporte y pasos con dashboard interactivo y coach IA.

## 🎯 ¿Qué es FitTrack?

FitTrack es una **web app completa** que te permite:

- ⚖️ **Registrar peso** diario con gráficas de evolución
- 🍽️ **Registrar comidas** con calorías y macros (proteínas, hidratos, grasas)
- 🏋️ **Registrar entrenamientos** con estimación automática de kcal quemadas
- 🚶 **Registrar pasos** diarios
- 🤖 **Coach IA** que analiza tus datos y te da consejos personalizados
- 🔮 **Proyecciones** de cuándo alcanzarás tu peso objetivo
- 📊 **Dashboard interactivo** con gráficas y KPIs en tiempo real

**Todo funciona en el navegador**, con datos guardados en GitHub para que nunca los pierdas.

---

## 🚀 Guía de Instalación Paso a Paso

### Prerrequisitos

- Una cuenta de **GitHub** (gratis)
- Una cuenta de **NaN.builders** (gratis)
- Un **token de API** de NaN (para el coach IA)

### Paso 1: Crear el repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Ponle un nombre a tu repositorio, ej: `mi-dieta`
3. **Importante:** Márcalo como **Público** o **Privado** (tú decides)
4. **NO** marques "Add a README" ni "Add .gitignore"
5. Pulsa **Create repository**

### Paso 2: Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/mi-dieta.git
cd mi-dieta
```

### Paso 3: Descargar FitTrack

Descarga todos los archivos de FitTrack y ponlos en tu repositorio:

```bash
# Los archivos que necesitas son:
# - dashboard.html   → Tu dashboard interactivo
# - server.js        → Backend con APIs REST + IA
# - package.json     → Dependencias de Node.js
# - Dockerfile       → Para deploy en NaN
# - .gitignore       → Excluye archivos sensibles
# - data/database.json → Tu base de datos (empieza vacía)
# - scripts/registro.py → CLI para registrar desde terminal
# - *.sh → Atajos de terminal (peso.sh, comida.sh, deporte.sh)
```

> **Tip:** Puedes copiar los archivos desde el repositorio template de FitTrack o descargarlos directamente.

### Paso 4: Configurar tu perfil

Edita `data/database.json` y personaliza:

```json
{
  "meta": {
    "nombre": "Tu Nombre",
    "altura_cm": 174,
    "peso_inicial_kg": 90,
    "peso_objetivo_kg": 80,
    "fecha_inicio": "2026-06-11"
  },
  "perfil": {
    "edad": 30,
    "genero": "masculino",
    "nivel_actividad": "activo"
  }
}
```

**Ajusta estos valores a tu perfil real** — la IA los usa para personalizar las estimaciones.

### Paso 5: Obtener tu token de API

1. Inicia sesión en [NaN.builders](https://nan.builders)
2. Ve a tu **panel de configuración**
3. Copia tu **API token** (empieza por `sk-...`)

### Paso 6: Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
NAN_API=tu_token_aqui
```

> ⚠️ **IMPORTANTE:** El archivo `.env` está en `.gitignore`, así que **NUNCA** se subirá a GitHub. Tu token está seguro.

También necesitas configurar variables para el sync a GitHub (opcional):

```
GITHUB_REPO_OWNER=tu_usuario_github
GITHUB_REPO_NAME=tu_repo
```

### Paso 7: Instalar dependencias

```bash
npm install
```

Esto instalará Express.js (el servidor web).

### Paso 8: Probar localmente

```bash
node server.js
```

Abre [http://localhost:5050](http://localhost:5050) y verás tu dashboard.

### Paso 9: Deploy en NaN.builders

1. Ve a [nan.builders](https://nan.builders)
2. Pulsa **New App**
3. Conecta tu repositorio de GitHub
4. En la pestaña **Env**, añade:
   - `NAN_API` = tu_token_aqui
   - `GITHUB_REPO_OWNER` = tu_usuario_github (opcional)
   - `GITHUB_REPO_NAME` = tu_repo (opcional)
5. Pulsa **Deploy**

¡Listo! Tu dashboard estará en `tu-app.apps.nan.builders`.

### Paso 10: Primer uso

1. Abre tu dashboard en el navegador
2. Registra tu peso inicial
3. Empieza a registrar comidas
4. Pregunta al coach IA para consejos personalizados

---

## 📱 Uso desde Terminal (CLI)

También puedes registrar datos desde la terminal:

```bash
# Registrar peso
./peso.sh 85.5

# Registrar comida
./comida.sh desayuno 'Café con leche + tostada' 300

# Registrar deporte
./deporte.sh 'Pierna' 45 alta

# Resumen del día
python3 scripts/registro.py resumen
```

---

## 📁 Estructura del Proyecto

```
mi-dieta/
├── data/
│   └── database.json     ← Tu base de datos (JSON estructurado)
├── scripts/
│   └── registro.py       ← CLI para registrar desde terminal
├── dashboard.html        ← Dashboard interactivo (Chart.js + Aurora)
├── server.js             ← Backend Express + APIs REST + IA
├── package.json          ← Dependencias Node.js
├── Dockerfile            ← Deploy en NaN
├── .gitignore            ← Excluye .env y node_modules
├── peso.sh               ← Atajo: ./peso.sh 96.5
├── comida.sh             ← Atajo: ./comida.sh cena 'huevos' 300
└── deporte.sh            ← Atajo: ./deporte.sh 'Pierna' 45 alta
```

---

## ⚙️ Personalización

### Cambiar tu objetivo de peso

Edita `peso_objetivo_kg` en `data/database.json`.

### Cambiar nivel de actividad

En `data/database.json`, modifica `nivel_actividad`:
- `sedentario` → poco ejercicio
- `activo` → ejercicio 3-4x/semana
- `muy_activo` → ejercicio diario

### Desactivar sync a GitHub

Si no quieres que los datos se sincronicen a GitHub, elimina las líneas `syncGitHub(db)` de `server.js`.

---

## 🔒 Privacidad

- **NUNCA** subas tu `.env` a GitHub (está protegido por `.gitignore`)
- Los datos personales están en `database.json` — si usas repo público, considera encriptarlo o usar repo privado
- El coach IA solo usa tus datos para dar consejos — no se almacena nada en servidores externos

---

## 🛠️ Solución de Problemas

| Problema | Solución |
|---------|----------|
| Dashboard en blanco | Abre DevTools (F12) y mira la consola por errores |
| Coach IA no responde | Verifica que `NAN_API` está configurado en NaN Env |
| Puerto ya en uso | Cambia `PORT` en server.js o mata el proceso: `lsof -ti:5050 | xargs kill` |
| Datos no se guardan | Verifica permisos de escritura en `data/` |

---

## 📈 Proyecciones

FitTrack calcula automáticamente:
- **TMB** (Tasa Metabólica Basal) con la fórmula de Mifflin-St Jeor
- **TDEE** (Gasto Total Diario) según tu nivel de actividad
- **Ritmos de pérdida** de peso: 0.3, 0.5, 0.7 y 1.0 kg/semana
- **Fecha estimada** para alcanzar tu objetivo

---

## 🤝 Créditos

Hecho con ❤️ por tu nombre — Inspirado en el seguimiento personal de dieta.

Basado en el proyecto [FitTrack](https://github.com/Ntizar/dieta) de David Antizar.
