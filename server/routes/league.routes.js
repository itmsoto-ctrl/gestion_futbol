const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN
router.get('/my-leagues', verifyToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT *, 
            (SELECT COUNT(*) FROM league_matches WHERE league_id = leagues.id) as total_matches 
            FROM leagues 
            WHERE admin_id = ? 
            ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener ligas", error: error.message });
    }
});

// 2. CREAR LIGA (NORMALIZADA CON IDs)
router.post('/create', verifyToken, async (req, res) => {
    const { config, schedule } = req.body;
    const adminId = req.user.id;
    const inviteToken = crypto.randomBytes(5).toString('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // A. Insertar la Liga
        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (
                admin_id, name, teams_count, match_minutes, 
                has_return_match, has_playoffs, playoff_teams, 
                playoff_format, start_date, playing_days, invite_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, config.name, config.teamsCount, config.duration,
                config.hasReturnMatch || 0, config.hasPlayoffs || 0, 
                config.playoffTeams || 4, config.playoffFormat || 'single', 
                config.startDate, JSON.stringify(config.selectedVenues), inviteToken
            ]
        );
        const leagueId = leagueResult.insertId;

        // B. Insertar Equipos y Crear Mapa de IDs (Usando .trim() para seguridad)
        const teamIdsMap = {};
        for (const team of config.teams) {
            const cleanName = team.name.trim();
            const [tResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name) VALUES (?, ?)`,
                [leagueId, cleanName]
            );
            teamIdsMap[cleanName] = tResult.insertId;
        }

        // C. Insertar Sedes y Crear Mapa de IDs (Usando .trim())
        const venueIdsMap = {};
        for (const v of config.selectedVenues) {
            const cleanVenueName = v.name.trim();
            const [vResult] = await connection.execute(
                `INSERT INTO venues (name, address, city, created_by) VALUES (?, ?, ?, ?)`,
                [cleanVenueName, v.address || '', v.city || '', adminId]
            );
            venueIdsMap[cleanVenueName] = vResult.insertId;
        }

        // D. Insertar Partidos con Filtrado Robusto
       // D. Insertar Partidos usando los IDs mapeados
if (schedule && schedule.length > 0) {
    const matchData = schedule.map(item => {
        // Buscamos los IDs en el mapa. Si es "1º Clasif", devolverá undefined.
        const hId = teamIdsMap[item.match.home.trim()];
        const aId = teamIdsMap[item.match.away.trim()];
        const vId = venueIdsMap[item.venue.trim()];

        return [
            leagueId,
            hId || null, // Si no hay ID (Playoffs), enviamos NULL
            aId || null, // Si no hay ID (Playoffs), enviamos NULL
            vId,         // La sede SIEMPRE debe existir
            item.dateStr,
            item.time
        ];
    });

    try {
        await connection.query(
            `INSERT INTO league_matches (league_id, home_team_id, away_team_id, venue_id, match_date, match_time) 
             VALUES ?`,
            [matchData]
        );
        console.log("✅ Calendario completo (Regular + Playoffs) guardado.");
    } catch (insertError) {
        console.error("❌ Error en el INSERT de partidos:", insertError);
        throw insertError; 
    }
}

        await connection.commit();
        res.status(201).json({ message: "Liga creada con éxito", leagueId, inviteToken });

    } catch (error) {
        await connection.rollback();
        console.error("🔥 Error en la transacción:", error);
        res.status(500).json({ message: "Error al procesar la creación", error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;