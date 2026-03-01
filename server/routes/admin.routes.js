const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importamos el pool de conexiones que creaste en config/

// RUTA: Obtener el estado de todos los equipos para el panel de admin
router.get('/teams-status', async (req, res) => {
    try {
        // Esta consulta hace magia: une equipos con capitanes y cuenta jugadores en una sola pasada
        const sql = `
            SELECT 
                t.id, 
                t.name, 
                t.logo_url,
                u.username AS captain_name,
                u.phone AS captain_phone,
                (SELECT COUNT(*) FROM players WHERE team_id = t.id) AS registered_count,
                (SELECT COUNT(*) FROM players WHERE team_id = t.id AND is_pwa = 1) AS pwa_count
            FROM teams t
            LEFT JOIN users u ON t.captain_id = u.id
        `;
        
        // Al usar 'await', el código espera a la DB de forma limpia (sin bloqueos)
        const [rows] = await db.query(sql);
        
        res.json(rows);
    } catch (error) {
        console.error("❌ Error en la ruta teams-status:", error);
        res.status(500).json({ 
            error: "Error interno al obtener el estado de los equipos",
            details: error.message 
        });
    }
});

// Exportamos el router para que el index.js principal lo pueda usar
module.exports = router;