// routes/league_routes.js

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

// 2. DETALLE DE LIGA (Equipos y Jugadores)
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

        const [players] = await pool.execute(
            'SELECT p.team_id, p.dorsal, p.full_name AS fullName, p.dni, p.photo_url FROM league_players p JOIN league_teams t ON p.team_id = t.id WHERE t.league_id = ?',
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

// 3. PORTAL PÚBLICO (Acceso desde WhatsApp)
router.get('/team-portal/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const [teams] = await pool.execute(
            `SELECT t.id, t.name as teamName, t.captain_id, t.league_id, l.name as leagueName, l.player_fields_config 
             FROM league_teams t JOIN leagues l ON t.league_id = l.id WHERE t.team_token = ?`,
            [token]
        );

        if (teams.length === 0) return res.status(404).json({ message: "Enlace no válido" });

        const team = teams[0];
        const type = (!team.captain_id || team.captain_id === 0) ? 'CAPTAIN_INVITE' : 'PLAYER_REGISTRATION';

        res.json({ 
            type, 
            team,
            fieldsConfig: team.player_fields_config ? JSON.parse(team.player_fields_config) : {} 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. CREAR LIGA
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
            if (team.temp_id !== undefined) teamIdMap[team.temp_id] = newId;
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

// 5. ACTUALIZAR EQUIPO
router.patch('/teams/:id', verifyToken, async (req, res) => {
    try {
        await pool.execute(
            "UPDATE league_teams SET logo = ?, captain_phone = ? WHERE id = ?",
            [req.body.logo_url || null, req.body.captain_phone || null, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. VINCULAR CAPITÁN
router.post('/claim-team', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.adminId || req.user.userId;
        await pool.execute('UPDATE league_teams SET captain_id = ? WHERE id = ?', [userId, req.body.teamId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. VINCULAR JUGADOR (Fichaje Maestro)
router.post('/register-player-full', async (req, res) => {
    const { email, fullName, dorsal, dni, teamId, phone, photoUrl } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [uRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (uRows.length === 0) throw new Error("Usuario no encontrado");
        const userId = uRows[0].id;

        await connection.execute(
            `UPDATE users SET dni = IFNULL(?, dni), phone = IFNULL(?, phone), photo_url = IFNULL(?, photo_url), name = IFNULL(?, name) WHERE id = ?`,
            [dni || null, phone || null, photoUrl || null, fullName || null, userId]
        );

        const [existing] = await connection.execute('SELECT id FROM league_players WHERE team_id = ? AND user_id = ?', [teamId, userId]);
        if (existing.length === 0) {
            await connection.execute(
                `INSERT INTO league_players (team_id, user_id, full_name, dorsal, status, is_pwa) VALUES (?, ?, ?, ?, ?, ?)`,
                [teamId, userId, fullName, dorsal || null, 'active', 1]
            );
        }
        await connection.commit();
        res.status(201).json({ success: true });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// ⚽ CALENDARIO DEL EQUIPO (Jugador)
router.get('/my-calendar/:teamId', async (req, res) => {
    const { teamId } = req.params;
    try {
        const [rows] = await pool.execute(
            `SELECT m.*, t1.name as home_team, t1.logo as home_logo, t2.name as away_team, t2.logo as away_logo 
            FROM league_matches m
            JOIN league_teams t1 ON m.home_team_id = t1.id
            JOIN league_teams t2 ON m.away_team_id = t2.id
            WHERE m.home_team_id = ? OR m.away_team_id = ?
            ORDER BY m.match_date ASC`, 
            [teamId, teamId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 👥 PLANTILLA (Roster)
router.get('/teams/:teamId/players', async (req, res) => {
    const { teamId } = req.params;
    try {
        const [players] = await pool.execute(
            `SELECT p.id, p.full_name as name, u.photo_url, p.dorsal, u.position, u.country_code, s.logo as team_logo
            FROM league_players p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN league_teams s ON p.team_id = s.id
            WHERE p.team_id = ? AND p.status = 'active'`,
            [teamId]
        );
        res.json(players.map(p => ({
            ...p,
            name: p.name || 'JUGADOR',
            position: p.position || 'MCO',
            country_code: p.country_code || 'es',
            rating: 60,
            stats: { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 }
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📅 ACTUALIZAR FECHA/HORA/PISTA DE UN PARTIDO (Versión Blindada)
router.patch('/matches/:matchId', verifyToken, async (req, res) => {
    const { match_date, match_time, venue_id, pitch_name } = req.body;
    const { matchId } = req.params;

    console.log(`[PATCH] Actualizando partido ${matchId}:`, req.body);

    try {
        // Aseguramos que la fecha sea solo YYYY-MM-DD para MySQL
        const cleanDate = match_date ? match_date.split('T')[0] : null;

        const [result] = await pool.execute(
            `UPDATE league_matches 
             SET match_date = IFNULL(?, match_date), 
                 match_time = IFNULL(?, match_time), 
                 venue_id = IFNULL(?, venue_id), 
                 pitch_name = IFNULL(?, pitch_name) 
             WHERE id = ?`,
            [cleanDate, match_time, venue_id, pitch_name, matchId]
        );

        if (result.affectedRows === 0) {
            console.error(`🚨 No se encontró el partido con ID ${matchId}`);
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.json({ success: true, message: "Partido actualizado" });
    } catch (error) {
        console.error("🚨 Error SQL en PATCH /matches:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 📅 OBTENER CALENDARIO COMPLETO (Admin con Truco Ninja)
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
        
        let currentRound = 1;
        let currentDate = null;

        const formattedMatches = matches.map(match => {
            const dateStr = new Date(match.match_date).toISOString().split('T')[0];
            if (currentDate !== null && currentDate !== dateStr) currentRound++;
            currentDate = dateStr;
            return { ...match, round: currentRound, match_date: dateStr }; // Normalizamos la fecha aquí
        });

        res.json(formattedMatches);
    } catch (error) {
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

module.exports = router;