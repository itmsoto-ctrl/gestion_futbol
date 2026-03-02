const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// --- RUTA: Obtener el estado de todos los equipos ---
router.get('/teams-status', async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.id, 
                t.name, 
                t.logo_url,
                u.username AS captain_name,
                u.phone AS captain_phone,
                (SELECT COUNT(*) FROM players WHERE team_id = t.id) AS registered_count,
                (SELECT COUNT(*) FROM players WHERE team_id = t.id AND is_pwa = 1) AS pwa_count
            FROM league_teams t
            LEFT JOIN users u ON t.captain_id = u.id
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (error) {
        console.error("❌ Error en teams-status:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- RUTA: Buscador de Sedes (PARA EL LEAGUE CREATOR) ---
// ⚠️ Nota: No pongas "/api/admin" aquí, eso ya lo pone el index.js
router.get('/venues/search', async (req, res) => {
    const { q } = req.query;
    console.log("-----------------------------------------");
    console.log("🔎 PETICIÓN RECIBIDA - Buscando sede:", q);

    try {
        // Buscamos coincidencias en nombre o ciudad en Railway
        const sql = 'SELECT * FROM venues WHERE name LIKE ? OR city LIKE ? LIMIT 5';
        const [rows] = await db.query(sql, [`%${q}%`, `%${q}%`]);

        console.log(`✅ RESULTADO: ${rows.length} sedes encontradas.`);
        res.json(rows);
    } catch (error) {
        console.error("🚨 ERROR EN BUSCADOR:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;