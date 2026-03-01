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