require('dotenv').config();
const express = require('express');
const cors = require('cors');


// Importación de rutas modulares
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes'); // ✅ Activado
const leagueRoutes = require('./routes/league.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/leagues', leagueRoutes);

// --- RUTAS V2 (MODULARES) ---
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes); // ✅ Activado: Login y Registro ya disponibles

// --- SALUD DEL SISTEMA ---
app.get('/health', (req, res) => {
    res.send('🚀 Servidor V2 de Fútbol: Operativo y con Autenticación Activa');
});

const PORT = process.env.PORT || 3001;
// Middleware para capturar errores y verlos en la terminal de VS Code
app.use((err, req, res, next) => {
    console.error("❌ ERROR DETECTADO EN EL SERVIDOR:");
    console.error("Mensaje:", err.message);
    console.error("Ruta:", req.originalUrl);
    console.error("Stack:", err.stack); // Esto nos dirá la línea exacta del fallo
    res.status(500).json({ error: 'Error interno del servidor', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    ✅ SERVIDOR V2 LISTO EN PUERTO ${PORT}
    🛡️ Seguridad JWT & Bcrypt: ACTIVA
    📂 Estructura Modular: FUNCIONANDO
    ⚡ Pool de Conexiones MySQL: CONECTADO
    =========================================
    `);
});

const pool = require('./config/db');
pool.query('SELECT 1 + 1 AS test')
    .then(() => console.log("✨ CONEXIÓN REAL CON RAILWAY CONFIRMADA"))
    .catch(err => console.error("🚨 FALLO REAL DE CONEXIÓN:", err.message));