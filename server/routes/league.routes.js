const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN
router.get('/my-leagues', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.adminId || req.user.userId;
        const [rows] = await pool.execute(
            'SELECT id, name, invite_token, teams_count, match_minutes, playing_days FROM leagues WHERE admin_id = ?',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. DETALLE DE LIGA (Equipos y Jugadores) - VERSIÓN CORREGIDA
router.get('/league-details/:id', verifyToken, async (req, res) => {
    try {
        const identifier = req.params.id;
        const [leagues] = await pool.execute(
            'SELECT * FROM leagues WHERE id = ? OR invite_token = ?',
            [identifier, identifier]
        );

        if (leagues.length === 0) return res.status(404).json({ message: "Liga no encontrada" });
        const realLeagueId = leagues[0].id;

        const [teams] = await pool.execute(
            'SELECT id, name, logo, team_token AS invite_token, captain_phone FROM league_teams WHERE league_id = ?',
            [realLeagueId]
        );

        // 🔗 AQUÍ ESTÁ EL CAMBIO: Hacemos un JOIN con la tabla 'users'
        // para traer el is_pwa REAL de la cuenta del usuario.
        const [players] = await pool.execute(
            `SELECT 
                lp.team_id, 
                lp.id, 
                lp.dorsal, 
                lp.full_name AS fullName, 
                lp.dni, 
                lp.photo_url, 
                lp.is_captain, 
                u.is_pwa -- <--- Sacamos el dato de la tabla users, no de league_players
             FROM league_players lp
             LEFT JOIN users u ON lp.user_id = u.id 
             WHERE lp.team_id IN (SELECT id FROM league_teams WHERE league_id = ?)`,
            [realLeagueId]
        );

        const teamsWithPlayers = teams.map(team => ({
            ...team,
            player_count: players.filter(p => p.team_id === team.id).length,
            players: players.filter(p => p.team_id === team.id)
        }));

        res.json({ league: leagues[0], teams: teamsWithPlayers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. CREAR LIGA (Mantiene la lógica de Calendario)
router.post('/create', verifyToken, async (req, res) => {
    const { name, teamsCount, duration, startDate, selectedVenues, registrationConfig, teams, schedule } = req.body;
    const adminId = req.user?.id || req.user?.adminId || req.user?.userId || null; 

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const inviteToken = crypto.randomBytes(5).toString('hex');
        const fieldsConfig = JSON.stringify(registrationConfig || {});

        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (admin_id, name, teams_count, match_minutes, start_date, playing_days, invite_token, player_fields_config) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, name || 'Nueva Liga', teamsCount || 0, duration || 60, startDate, JSON.stringify(selectedVenues || []), inviteToken, fieldsConfig]
        );
        const leagueId = leagueResult.insertId;

        const teamIdMap = {}; 
        for (let i = 0; i < (teams || []).length; i++) {
            const team = teams[i];
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const [teamResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, team.name.trim(), teamToken, team.phone || null]
            );
            const newId = teamResult.insertId;
            teamIdMap[i] = newId;
            teamIdMap[team.name.trim()] = newId;
        }

        if (schedule && schedule.length > 0) {
            for (const item of schedule) {
                const matchData = item.match || {};
                const homeKey = typeof matchData.home === 'object' ? (matchData.home?.id ?? matchData.home?.name) : matchData.home;
                const awayKey = typeof matchData.away === 'object' ? (matchData.away?.id ?? matchData.away?.name) : matchData.away;

                await connection.execute(
                    `INSERT INTO league_matches (league_id, home_team_id, away_team_id, venue_id, pitch_name, match_date, match_time) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [leagueId, teamIdMap[homeKey], teamIdMap[awayKey], item.venue_id || 1, item.fieldName || item.field || null, item.dateStr, item.time]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ success: true, leagueId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 🎖️ 4. ASIGNAR/QUITAR CAPITÁN (Nuevo)
router.patch('/players/:playerId/toggle-captain', verifyToken, async (req, res) => {
    const { playerId } = req.params;
    try {
        const [player] = await pool.execute('SELECT is_captain FROM league_players WHERE id = ?', [playerId]);
        if (player.length === 0) return res.status(404).json({ error: "Jugador no encontrado" });

        const newStatus = player[0].is_captain ? 0 : 1;
        await pool.execute('UPDATE league_players SET is_captain = ? WHERE id = ?', [newStatus, playerId]);

        res.json({ success: true, is_captain: newStatus });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ⚽ 5. REPORTAR/VALIDAR MARCADOR POR CAPITÁN (Versión Doble Validación)
router.post('/matches/:matchId/report-score', verifyToken, async (req, res) => {
    const { matchId } = req.params;
    const { score_home, score_away, action } = req.body; // action: 'PROPOSE' o 'VALIDATE'
    const userId = req.user.id;

    try {
        // 1. Verificar permisos de capitán
        const [perm] = await pool.execute(
            `SELECT m.id, m.status, m.score_proposer_id FROM league_matches m
             JOIN league_players lp ON (lp.team_id = m.home_team_id OR lp.team_id = m.away_team_id)
             WHERE m.id = ? AND lp.user_id = ? AND lp.is_captain = 1`,
            [matchId, userId]
        );

        if (perm.length === 0) return res.status(403).json({ error: "No eres capitán de este partido" });

        const match = perm[0];

        if (action === 'PROPOSE') {
            // Primer capitán en subir el resultado
            await pool.execute(
                `UPDATE league_matches SET score_home = ?, score_away = ?, status = 'awaiting_validation', score_proposer_id = ? WHERE id = ?`,
                [score_home, score_away, userId, matchId]
            );
        } else if (action === 'VALIDATE') {
            // Segundo capitán confirma
            await pool.execute(
                `UPDATE league_matches SET status = 'finished' WHERE id = ?`,
                [matchId]
            );
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📅 6. ACTUALIZAR PARTIDO (Admin)
router.patch('/matches/:matchId', verifyToken, async (req, res) => {
    const { match_date, match_time, venue_id, pitch_name } = req.body;
    const { matchId } = req.params;
    try {
        const cleanDate = match_date ? match_date.split('T')[0] : null;
        await pool.execute(
            `UPDATE league_matches 
             SET match_date = IFNULL(?, match_date), match_time = IFNULL(?, match_time), 
                 venue_id = IFNULL(?, venue_id), pitch_name = IFNULL(?, pitch_name) 
             WHERE id = ?`,
            [cleanDate, match_time, venue_id, pitch_name, matchId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📅 7. OBTENER CALENDARIO COMPLETO (Admin)
router.get('/:leagueId/full-calendar', verifyToken, async (req, res) => {
    try {
        const [matches] = await pool.execute(`
            SELECT m.*, t1.name as home_name, t1.logo as home_logo, t2.name as away_name, t2.logo as away_logo
            FROM league_matches m
            JOIN league_teams t1 ON m.home_team_id = t1.id
            JOIN league_teams t2 ON m.away_team_id = t2.id
            WHERE m.league_id = ?
            ORDER BY m.match_date ASC, m.match_time ASC
        `, [req.params.leagueId]);
        
        res.json(matches.map(m => ({ ...m, match_date: new Date(m.match_date).toISOString().split('T')[0] })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📅 8. OBTENER CALENDARIO DE UN EQUIPO (Para el PlayerHome)
router.get('/my-calendar/:teamId', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const [matches] = await pool.execute(`
            SELECT 
                m.*, 
                t1.name as home_team, 
                t1.logo as home_logo, 
                t2.name as away_team, 
                t2.logo as away_logo
            FROM league_matches m
            JOIN league_teams t1 ON m.home_team_id = t1.id
            JOIN league_teams t2 ON m.away_team_id = t2.id
            WHERE m.home_team_id = ? OR m.away_team_id = ?
            ORDER BY m.match_date ASC, m.match_time ASC
        `, [teamId, teamId]);
        
        const formattedMatches = matches.map(m => ({
            ...m,
            match_date: m.match_date ? new Date(m.match_date).toISOString().split('T')[0] : null
        }));

        res.json(formattedMatches);
    } catch (error) {
        console.error("🚨 Error en my-calendar:", error);
        res.status(500).json({ error: error.message });
    }
});

// 🚨 NUKE
router.delete('/nuke-database', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
        await connection.execute('TRUNCATE TABLE league_matches');
        await connection.execute('TRUNCATE TABLE league_players');
        await connection.execute('TRUNCATE TABLE league_teams');
        await connection.execute('TRUNCATE TABLE leagues');
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();
        res.json({ message: "Base de datos limpia" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 🔍 BUSCAR PARTIDO PENDIENTE DE ACTA (SIN PORTERO Y SIN FRENOS DE FECHA)
// Fíjate que he quitado "verifyToken," después de la URL
router.get('/pending-match/:teamId', async (req, res) => {
    const { teamId } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT m.*, t1.name as home_team, t2.name as away_team 
             FROM league_matches m
             JOIN league_teams t1 ON m.home_team_id = t1.id
             JOIN league_teams t2 ON m.away_team_id = t2.id
             WHERE (m.home_team_id = ? OR m.away_team_id = ?)
             AND m.status IN ('awaiting_score', 'awaiting_validation')
             LIMIT 1`, 
            [teamId, teamId]
        );

        if (rows.length === 0) return res.json(null);

        res.json(rows[0]);
    } catch (error) {
        console.error("🚨 Error buscando acta:", error);
        res.status(500).json({ error: error.message });
    }
});

// 👥 9. OBTENER PLANTILLA DE UN EQUIPO (Para el RosterModal)
router.get('/teams/:teamId/players', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const [players] = await pool.execute(
            `SELECT lp.*, u.is_pwa 
             FROM league_players lp
             LEFT JOIN users u ON lp.user_id = u.id
             WHERE lp.team_id = ?`,
            [teamId]
        );
        
        res.json(players);
    } catch (error) {
        console.error("🚨 Error en la ruta de plantilla:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;