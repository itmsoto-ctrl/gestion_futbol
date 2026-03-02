require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// 1. IMPORTACIÓN DE RUTAS
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const leagueRoutes = require('./routes/league.routes');

const app = express(); // ✅ Creado al principio para poder usarlo abajo

// 2. CONFIGURACIÓN DE CORS (Antes de las rutas)
const corsOptions = {
    origin: [
      'http://localhost:3000', 
      'https://gestionfutbol-production.up.railway.app' // 👈 PON AQUÍ TU URL REAL
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // 👈 Añade X-Requested-With para Safari
};

app.use(cors(corsOptions)); // ✅ Aplicamos CORS con las opciones
app.use(express.json());    // ✅ Para que el servidor entienda JSON


// 3. RUTAS
app.use('/api/leagues', leagueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// 4. SALUD DEL SISTEMA
app.get('/health', (req, res) => {
    res.send('🚀 Servidor VORA: Operativo y con Autenticación Activa');
});

// 5. MIDDLEWARE DE ERRORES (Al final de todo)
app.use((err, req, res, next) => {
    console.error("❌ ERROR DETECTADO EN EL SERVIDOR:");
    console.error("Mensaje:", err.message);
    console.error("Ruta:", req.originalUrl);
    res.status(500).json({ 
        error: 'Error interno del servidor', 
        details: err.message 
    });
});

// 6. ARRANQUE DEL SERVIDOR
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    =========================================
    ✅ SERVIDOR VORA LISTO EN PUERTO ${PORT}
    🛡️ CORS configurado para Netlify
    =========================================
    `);
});

// 7. TEST DE CONEXIÓN A DB
pool.query('SELECT 1 + 1 AS test')
    .then(() => console.log("✨ CONEXIÓN CON RAILWAY CONFIRMADA"))
    .catch(err => console.error("🚨 FALLO DE CONEXIÓN DB:", err.message));