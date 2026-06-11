const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// CORS para desarrollo local
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Helper: obtener token NAN (para IA)
function getNanToken() {
  if (process.env.NAN_API) return process.env.NAN_API;
  if (process.env.NTIZAR_API) return process.env.NTIZAR_API;
  try {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^NAN_API=(.+)$/m);
    if (match) return match[1].trim();
  } catch (e) {}
  return '';
}

// Helper: leer database.json
function readDB() {
  const DB_PATH = path.join(__dirname, 'data', 'database.json');
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Helper: guardar database.json
function writeDB(db) {
  const DB_PATH = path.join(__dirname, 'data', 'database.json');
  db.meta.updated_at = new Date().toISOString();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// Helper: obtener fecha de hoy en zona horaria Madrid
function hoy() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
}

// Helper: construir contexto del usuario desde la DB
function perfilUsuario(db) {
  const pesoActual = db.peso.length > 0 ? db.peso[db.peso.length - 1].peso_kg : 90;
  const p = db.perfil || {};
  const m = db.meta || {};
  return {
    nombre: m.nombre || 'Usuario',
    edad: p.edad || 30,
    genero: p.genero || 'masculino',
    altura_cm: m.altura_cm || p.altura_cm || 174,
    peso_kg: pesoActual,
    peso_objetivo: m.peso_objetivo_kg || 80,
    nivel_actividad: p.nivel_actividad || 'activo'
  };
}

function contextoPerfil(db) {
  const u = perfilUsuario(db);
  return `${u.nombre}, ${u.edad} años, ${u.genero}, ${u.altura_cm}cm, ${u.peso_kg}kg (peso actual), objetivo ${u.peso_objetivo}kg, actividad: ${u.nivel_actividad}`;
}

// API: Asistente IA — Coach fitness inteligente
app.post('/api/ia/consejo', async (req, res) => {
  const { mensaje, historial } = req.body;
  const token = getNanToken();

  if (!token) {
    return res.json({
      consejo: '⚠️ Token de API no configurado. Añade NAN_API en las variables de entorno de NaN (pestaña Env) o en el archivo .env.',
      fallback: true
    });
  }

  const db = readDB();
  const fechaHoy = hoy();
  const ultimoPeso = db.peso[db.peso.length - 1];
  const comidasHoy = db.comidas.filter(c => c.fecha === fechaHoy);
  const totalHoy = comidasHoy.reduce((acc, c) => ({
    kcal: acc.kcal + (c.kcal || 0),
    proteinas: acc.proteinas + (c.proteinas_g || 0),
    hidratos: acc.hidratos + (c.hidratos_g || 0),
    grasas: acc.grasas + (c.grasas_g || 0)
  }), { kcal: 0, proteinas: 0, hidratos: 0, grasas: 0 });

  // Detectar alcohol en las comidas de hoy
  const alcoholHoy = comidasHoy.filter(c =>
    /volldamm|cerveza|vino|gintonic|gin|beer|alcohol|copa|botella/i.test(c.descripcion)
  );
  const kcalAlcohol = alcoholHoy.reduce((s, c) => s + (c.kcal || 0), 0);

  // Últimos 7 días resumen
  const ultimosPesos = db.peso.slice(-7);
  const pesosStr = ultimosPesos.map(p => `${p.fecha}: ${p.peso_kg}kg ${p.notas || ''}`).join('\n    ');

  // Entrenamientos
  const entrenos = db.deporte.slice(-5);
  const entrenosStr = entrenos.length > 0
    ? entrenos.map(d => `${d.fecha}: ${d.descripcion} (${d.duracion_min}min, ${d.kcal_estimadas} kcal, ${d.intensidad})`).join('\n    ')
    : 'Sin entrenamientos recientes';

  const perfil = perfilUsuario(db);
  const contexto = `
DATOS ACTUALES DE ${perfil.nombre.toUpperCase()}:
- Perfil: ${perfil.edad} años, ${perfil.genero}, ${perfil.altura_cm}cm
- Peso actual: ${ultimoPeso.peso_kg}kg (fecha: ${ultimoPeso.fecha})
- Objetivo: ${db.meta.peso_objetivo_kg}kg
- Inicio: ${db.meta.peso_inicial_kg}kg el ${db.meta.fecha_inicio}
- Perdido: ${(db.meta.peso_inicial_kg - ultimoPeso.peso_kg).toFixed(1)}kg en ${Math.round((new Date(fechaHoy) - new Date(db.meta.fecha_inicio)) / 86400000)} días
- TMB: ~1838 kcal, TDEE: ~2527 kcal
- Actividad: ${perfil.nivel_actividad}

HOY (${fechaHoy}):
${comidasHoy.length > 0
  ? comidasHoy.map(c => `- ${c.hora}: ${c.descripcion} (${c.kcal} kcal, P:${c.proteinas_g}g H:${c.hidratos_g}g G:${c.grasas_g}g)`).join('\n    ')
  : '- Sin comidas registradas aún'}
- Total hoy: ${totalHoy.kcal} kcal | P:${totalHoy.proteinas}g H:${totalHoy.hidratos}g G:${totalHoy.grasas}g
${kcalAlcohol > 0 ? `- ⚠️ ALCOHOL detectado: ${kcalAlcohol} kcal en ${alcoholHoy.length} tomas` : ''}

ÚLTIMOS PESOS:
    ${pesosStr}

ENTRENAMIENTOS:
    ${entrenosStr}

PREGUNTA DEL USUARIO: ${mensaje}`;

  try {
    const response = await fetch('https://api.nan.builders/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'qwen3.6',
        messages: [
          {
            role: 'system',
            content: `Eres un coach de fitness experto, directo y motivador. Das consejos nutricionales REALES basados en los datos del usuario.

REGLAS:
1. Sé directo y honesto con el usuario
2. Si detectas alcohol en sus datos, señala el impacto en sus objetivos
3. Das consejos nutricionales basados en sus datos reales
4. Usa frases motivadoras: "¡Vamos!", "¡Sin excusas!", "¡A darlo todo!"
5. Responde SIEMPRE en español. Sé conciso: máximo 3-4 párrafos. Usa emojis con moderación.
6. Si te pregunta por progreso, da números reales: peso, ritmo de pérdida, kcal promedio.
7. NUNCA seas amable con el alcohol. Siempre señala las consecuencias.`,
          },
          {
            role: 'user',
            content: contexto
          }
        ],
        max_tokens: 600,
        temperature: 0.8
      })
    });

    const data = await response.json();
    const consejo = data.choices?.[0]?.message?.content || 'No pude generar respuesta. Intenta de nuevo.';
    res.json({ consejo });
  } catch (err) {
    res.json({
      consejo: `⚠️ Error de conexión con la IA: ${err.message}. Inténtalo de nuevo.`,
      fallback: true
    });
  }
});

// API: Registrar peso
app.post('/api/peso', (req, res) => {
  try {
    const { peso_kg, notas } = req.body;
    if (!peso_kg || isNaN(parseFloat(peso_kg))) {
      return res.status(400).json({ error: 'Peso no válido' });
    }
    const db = readDB();
    db.peso.push({
      fecha: hoy(),
      hora: 'mañana',
      peso_kg: parseFloat(peso_kg),
      notas: notas || ''
    });
    writeDB(db);
    syncGitHub(db);
    res.json({ ok: true, mensaje: `Peso ${peso_kg}kg registrado para hoy` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Registrar comida
app.post('/api/comida', (req, res) => {
  try {
    const { hora, tipo, descripcion, kcal, proteinas_g, hidratos_g, grasas_g, notas } = req.body;
    if (!descripcion) return res.status(400).json({ error: 'Descripción requerida' });
    const db = readDB();
    db.comidas.push({
      fecha: hoy(),
      hora: hora || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
      tipo: tipo || 'comida',
      descripcion,
      kcal: parseInt(kcal) || 0,
      proteinas_g: parseInt(proteinas_g) || 0,
      hidratos_g: parseInt(hidratos_g) || 0,
      grasas_g: parseInt(grasas_g) || 0,
      notas: notas || ''
    });
    writeDB(db);
    syncGitHub(db);
    res.json({ ok: true, mensaje: 'Comida registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Registrar ejercicio
app.post('/api/deporte', (req, res) => {
  try {
    const { descripcion, duracion_min, kcal_estimadas, intensidad, notas } = req.body;
    if (!descripcion) return res.status(400).json({ error: 'Descripción requerida' });
    const db = readDB();
    db.deporte.push({
      fecha: hoy(),
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }),
      descripcion,
      duracion_min: parseInt(duracion_min) || 0,
      kcal_estimadas: parseInt(kcal_estimadas) || 0,
      intensidad: intensidad || 'media',
      notas: notas || ''
    });
    writeDB(db);
    syncGitHub(db);
    res.json({ ok: true, mensaje: 'Ejercicio registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Estimar kcal y macros de una comida con IA
app.post('/api/estimar-comida', async (req, res) => {
  const { descripcion, tipo } = req.body;
  if (!descripcion) return res.status(400).json({ error: 'Descripción requerida' });

  const db = readDB();
  const token = getNanToken();
  if (!token) {
    return res.json({ estimado: false, error: 'Token no configurado' });
  }

  try {
    const response = await fetch('https://api.nan.builders/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'qwen3.6',
        messages: [
          {
            role: 'system',
            content: `Eres un nutricionista experto. Estima las calorías y macros de una comida.

REGLAS:
1. Responde SOLO con JSON válido, sin texto adicional, sin markdown, sin \`\`\`
2. Usa cantidades realistas para la persona descrita
3. Si la descripción es vaga, asume porciones estándar
4. El tipo de comida (desayuno, almuerzo, cena, snack, etc.) ayuda a dimensionar
5. Siempre redondea a números enteros

Formato exacto:
{"kcal":450,"proteinas_g":35,"hidratos_g":45,"grasas_g":15}`
          },
          {
            role: 'user',
            content: `PERFIL: ${contextoPerfil(db)}
Tipo de comida: ${tipo || 'comida'}
Descripción: ${descripcion}

Estima kcal y macros (proteínas, hidratos, grasas en gramos). Responde SOLO el JSON.`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const clean = content.replace(/<\?xml[\s\S]*?\?>|<think>[\s\S]*?<\/think>/g, '').trim();
    const estimado = JSON.parse(clean);
    res.json({ estimado: true, ...estimado });
  } catch (err) {
    res.json({ estimado: false, error: 'No pude estimar: ' + err.message });
  }
});

// API: Estimar kcal de ejercicio con IA
app.post('/api/estimar-ejercicio', async (req, res) => {
  const { descripcion, duracion_min, intensidad } = req.body;
  if (!descripcion) return res.status(400).json({ error: 'Descripción requerida' });

  const db = readDB();
  const token = getNanToken();
  if (!token) {
    return res.json({ estimado: false, error: 'Token no configurado' });
  }

  try {
    const response = await fetch('https://api.nan.builders/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model: 'qwen3.6',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en fisiología del ejercicio. Estima las calorías quemadas en una sesión de entrenamiento.

REGLAS:
1. Responde SOLO con JSON válido, sin texto adicional, sin markdown, sin \`\`\`
2. Usa el peso ACTUAL de la persona para los cálculos (más peso = más kcal quemadas)
3. Si no dan duración, asume 45-60 min según el tipo de ejercicio
4. Si la intensidad es "muy_alta" multiplica x1.3, "alta" x1.1, "media" x1.0, "baja" x0.7
5. Siempre redondea a números enteros

Factor de actividad por tipo (kcal/kg/hora):
- Gym/pesas: 6-8
- Cardio (correr, bici): 8-12
- HIIT: 10-14
- Caminar: 3-5
- Natación: 7-10

Formato exacto:
{"kcal_estimadas":420,"duracion_sugerida":60,"intensidad_detectada":"alta","tipo":"cardio"}`
          },
          {
            role: 'user',
            content: `PERFIL: ${contextoPerfil(db)}
Descripción: ${descripcion}
Duración: ${duracion_min || 'no especificada'} minutos
Intensidad: ${intensidad || 'media'}

Estima las kcal quemadas. Responde SOLO el JSON.`
          }
        ],
        max_tokens: 120,
        temperature: 0.3
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const clean = content.replace(/<\?xml[\s\S]*?\?>|<think>[\s\S]*?<\/think>/g, '').trim();
    const estimado = JSON.parse(clean);
    res.json({ estimado: true, ...estimado });
  } catch (err) {
    res.json({ estimado: false, error: 'No pude estimar: ' + err.message });
  }
});

// API: Obtener datos (para el dashboard)
app.get('/api/datos', (req, res) => {
  try {
    const db = readDB();
    res.json(db);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === ENDPOINTS DE EDICIÓN/BORRADO ===

// Borrar registro genérico por tipo e índice
app.delete('/api/:tipo/:index', (req, res) => {
  try {
    const { tipo, index } = req.params;
    const allowedTypes = ['peso', 'comidas', 'deporte', 'pasos'];
    if (!allowedTypes.includes(tipo)) return res.status(400).json({ error: 'Tipo no válido' });
    const db = readDB();
    const i = parseInt(index);
    if (isNaN(i) || i < 0 || i >= db[tipo].length) return res.status(400).json({ error: 'Índice fuera de rango' });
    const eliminado = db[tipo].splice(i, 1)[0];
    writeDB(db);
    syncGitHub(db);
    res.json({ ok: true, mensaje: `Registro eliminado`, eliminado });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Editar registro genérico por tipo e índice
app.put('/api/:tipo/:index', (req, res) => {
  try {
    const { tipo, index } = req.params;
    const allowedTypes = ['peso', 'comidas', 'deporte', 'pasos'];
    if (!allowedTypes.includes(tipo)) return res.status(400).json({ error: 'Tipo no válido' });
    const db = readDB();
    const i = parseInt(index);
    if (isNaN(i) || i < 0 || i >= db[tipo].length) return res.status(400).json({ error: 'Índice fuera de rango' });
    const registro = db[tipo][i];
    Object.keys(req.body).forEach(k => {
      if (k !== 'fecha' && k !== 'hora') registro[k] = req.body[k];
    });
    writeDB(db);
    syncGitHub(db);
    res.json({ ok: true, mensaje: 'Registro actualizado', registro });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === SYNC A GITHUB (OPCIONAL) ===
async function syncGitHub(db) {
  const token = getNanToken();
  if (!token) return;

  const repoOwner = process.env.GITHUB_REPO_OWNER || 'TU_USUARIO';
  const repoName = process.env.GITHUB_REPO_NAME || 'TU_REPO';

  try {
    const getRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/database.json`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!getRes.ok) return;
    const fileData = await getRes.json();
    const sha = fileData.sha;

    const content = JSON.stringify(db, null, 2);
    const b64 = Buffer.from(content).toString('base64');

    await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/data/database.json`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json' },
      body: JSON.stringify({
        message: `FitTrack: actualización automática ${new Date().toISOString().slice(0,19)}`,
        content: b64,
        sha: sha
      })
    });
  } catch (err) {
    console.error('Sync GitHub falló:', err.message);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FitTrack corriendo en puerto ${PORT}`);
});
