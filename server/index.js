require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const leagueRoutes = require('./routes/league.routes');
const { startMatchWatcher } = require('./services/cron.service');

const app = express();

// ✅ 1. CONFIGURACIÓN DE CORS ÚNICA Y CORRECTA
const allowedOrigins = [
    'http://localhost:3000',
    'https://gestionfutbol7.netlify.app'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitimos peticiones sin origin (útil para Postman o Apps móviles)
        // o si el origen está en nuestra "lista blanca"
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por seguridad VORA (CORS)'));
        }
    },
    credentials: true,
    // He añadido 'PATCH' justo aquí abajo 👇
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ 2. MIDDLEWARES BÁSICOS
app.use(express.json());

// ✅ 3. RUTAS
app.use('/api/leagues', leagueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// ✅ 4. HEALTH CHECK
app.get('/health', (req, res) => {
    res.send('🚀 Servidor VORA: Operativo y con Autenticación Activa');
});

// ✅ 5. MIDDLEWARE DE ERRORES
app.use((err, req, res, next) => {
    console.error("❌ ERROR SERVIDOR:", err.message);
    res.status(500).json({ error: 'Error interno', details: err.message });
});

// ✅ 6. ARRANQUE
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SERVIDOR VORA LISTO EN PUERTO ${PORT}`);

    // 🔥 ¡ENCENDEMOS EL VIGILANTE AQUÍ! 🔥
    // Arranca justo cuando el servidor empieza a escuchar
    startMatchWatcher();
});

// TEST DB
pool.query('SELECT 1 + 1 AS test')
    .then(() => console.log("✨ CONEXIÓN CON RAILWAY CONFIRMADA"))
    .catch(err => console.error("🚨 FALLO DB:", err.message));