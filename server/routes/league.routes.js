const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN (Dashboard General)
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

// 2. DETALLE DE LIGA PARA EL ADMIN (Equipos, Tokens y Estado de Capitanes)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [league] = await pool.execute('SELECT * FROM leagues WHERE id = ?', [req.params.id]);
        if (league.length === 0) return res.status(404).json({ message: "Liga no encontrada" });

        const [teams] = await pool.execute(
            `SELECT id, name, team_token, captain_phone, captain_id, logo,
            (SELECT COUNT(*) FROM league_players WHERE team_id = league_teams.id) as player_count
            FROM league_teams WHERE league_id = ?`,
            [req.params.id]
        );

        res.json({ ...league[0], teams });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. PORTAL INTELIGENTE (Público - Se abre desde el enlace de WhatsApp)
router.get('/team-portal/:token', async (req, res) => {
    try {
        const [teams] = await pool.execute(
            `SELECT t.id, t.name as teamName, t.captain_id, l.name as leagueName, l.id as leagueId
             FROM league_teams t 
             JOIN leagues l ON t.league_id = l.id 
             WHERE t.team_token = ?`,
            [req.params.token]
        );

        if (teams.length === 0) return res.status(404).json({ message: "Enlace no válido" });

        const team = teams[0];
        const type = !team.captain_id ? 'CAPTAIN_INVITE' : 'PLAYER_REGISTRATION';
        res.json({ type, team });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. CREAR LIGA (Proceso de inicialización masiva)
router.post('/create', verifyToken, async (req, res) => {
    const { config, schedule } = req.body;
    const adminId = req.user.id;
    const inviteToken = crypto.randomBytes(5).toString('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // A. Insertar Liga
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

        // B. Insertar Equipos con su TOKEN único de WhatsApp
        const teamIdsMap = {};
        for (const team of config.teams) {
            const cleanName = team.name.trim();
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const [tResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, cleanName, teamToken, team.phone || null]
            );
            teamIdsMap[cleanName] = tResult.insertId;
        }

        // C. Insertar Sedes
        const venueIdsMap = {};
        for (const v of config.selectedVenues) {
            const cleanVenueName = v.name.trim();
            const [vResult] = await connection.execute(
                `INSERT INTO venues (name, address, city, created_by) VALUES (?, ?, ?, ?)`,
                [cleanVenueName, v.address || '', v.city || '', adminId]
            );
            venueIdsMap[cleanVenueName] = vResult.insertId;
        }

        // D. Insertar Partidos
        if (schedule && schedule.length > 0) {
            const matchData = schedule.map(item => {
                const hId = teamIdsMap[item.match.home.trim()];
                const aId = teamIdsMap[item.match.away.trim()];
                const vId = venueIdsMap[item.venue.trim()];
                return [leagueId, hId || null, aId || null, vId, item.dateStr, item.time];
            });
            await connection.query(
                `INSERT INTO league_matches (league_id, home_team_id, away_team_id, venue_id, match_date, match_time) VALUES ?`,
                [matchData]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Liga creada con éxito", leagueId });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 5. GESTIÓN DEL EQUIPO POR EL ADMIN (Actualizar logo o teléfono)
router.patch('/teams/:teamId', verifyToken, async (req, res) => {
    const { logo, captain_phone } = req.body;
    try {
        await pool.execute(
            'UPDATE league_teams SET logo = ?, captain_phone = ? WHERE id = ?',
            [logo || null, captain_phone || null, req.params.teamId]
        );
        res.json({ message: "Datos del equipo actualizados" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. VER PLANTILLA DE UN EQUIPO (Para Admin y Capitán)
router.get('/teams/:teamId/roster', verifyToken, async (req, res) => {
    try {
        const [players] = await pool.execute(
            'SELECT * FROM league_players WHERE team_id = ? ORDER BY created_at DESC',
            [req.params.teamId]
        );
        res.json(players);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. VINCULAR CAPITÁN AL EQUIPO
router.post('/claim-team', verifyToken, async (req, res) => {
    const { teamId } = req.body;
    try {
        const [team] = await pool.execute('SELECT captain_id, name FROM league_teams WHERE id = ?', [teamId]);
        if (team[0].captain_id !== null) return res.status(400).json({ message: "Equipo ya vinculado" });

        await pool.execute('UPDATE league_teams SET captain_id = ? WHERE id = ?', [req.user.id, teamId]);
        res.json({ message: `¡Ahora eres el capitán de ${team[0].name}!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. AUTO-REGISTRO DE JUGADOR CON CHECK PWA
router.post('/register-player', async (req, res) => {
    const { teamId, full_name, dorsal, dni, is_pwa } = req.body;
    try {
        await pool.execute(
            'INSERT INTO league_players (team_id, full_name, dorsal, dni, is_pwa) VALUES (?, ?, ?, ?, ?)',
            [teamId, full_name, dorsal, dni, is_pwa || false]
        );
        res.status(201).json({ message: "Registro completado con éxito" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;