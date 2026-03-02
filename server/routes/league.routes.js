const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN (Dashboard General)
router.get('/my-leagues', verifyToken, async (req, res) => {
    try {
        console.log("-----------------------------------------");
        console.log("🔍 BUSCANDO LIGAS PARA EL USER ID:", req.user);

        const userId = req.user.id || req.user.adminId || req.user.userId;

        if (!userId) {
            console.error("🚨 NO SE ENCONTRÓ ID EN EL TOKEN");
            return res.status(400).json({ error: "Token no contiene un ID de usuario válido" });
        }

        const [rows] = await pool.execute(
            'SELECT id, name, invite_token, teams_count, match_minutes FROM leagues WHERE admin_id = ?',
            [userId]
        );

        res.json(rows);
    } catch (error) {
        console.error("🚨 ERROR EN MY-LEAGUES:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. DETALLE DE LIGA
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const identifier = req.params.id;
        
        const [leagueRows] = await pool.execute(
            'SELECT * FROM leagues WHERE invite_token = ? OR id = ?',
            [identifier, identifier]
        );

        if (leagueRows.length === 0) return res.status(404).json({ message: "Liga no encontrada" });

        const league = leagueRows[0];

        const [teams] = await pool.execute(
            `SELECT id, name, team_token, captain_phone, captain_id, logo,
            (SELECT COUNT(*) FROM league_players WHERE team_id = league_teams.id) as player_count
            FROM league_teams WHERE league_id = ?`,
            [league.id]
        );
        
        res.json({ ...league, teams });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. PORTAL INTELIGENTE (Público) - ¡CORREGIDO!
// 3. PORTAL INTELIGENTE (Público) - Versión Blindada
router.get('/team-portal/:token', async (req, res) => {
    try {
        const token = req.params.token;
        console.log("-----------------------------------------");
        console.log("🎟️ BUSCANDO TOKEN VORA:", token);

        // Consultamos solo tablas que sabemos que existen y sus columnas correctas
        const [teams] = await pool.execute(
            `SELECT t.id, t.name as teamName, t.captain_id, t.league_id,
                    l.name as leagueName, l.player_fields_config
             FROM league_teams t 
             JOIN leagues l ON t.league_id = l.id 
             WHERE t.team_token = ?`,
            [token]
        );

        if (teams.length === 0) {
            console.log("❌ TOKEN NO ENCONTRADO:", token);
            return res.status(404).json({ message: "Enlace no válido o equipo inexistente" });
        }

        const team = teams[0];

        // Lógica de invitación basada en tu esquema (captain_id)
        const isCaptainMissing = (
            team.captain_id === null || 
            team.captain_id === undefined || 
            team.captain_id === 0
        );

        const type = isCaptainMissing ? 'CAPTAIN_INVITE' : 'PLAYER_REGISTRATION';
        
        console.log(`✅ EQUIPO: ${team.teamName} | MODO: ${type}`);

        res.json({ 
            type, 
            team,
            adminName: "Admin VORA", // Evitamos el error de columna u.fullName
            fieldsConfig: team.player_fields_config ? JSON.parse(team.player_fields_config) : {} 
        });
    } catch (error) {
        console.error("🚨 Error en Portal:", error.message);
        res.status(500).json({ error: "Error de servidor: " + error.message });
    }
});

// 4. CREAR LIGA
router.post('/create', verifyToken, async (req, res) => {
    const { config, schedule } = req.body;
    const adminId = req.user.id || req.user.adminId;
    const inviteToken = crypto.randomBytes(5).toString('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const fieldsConfig = JSON.stringify(config.registrationConfig);

        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (
                admin_id, name, teams_count, match_minutes, 
                has_return_match, has_playoffs, playoff_teams, 
                playoff_format, start_date, playing_days, invite_token,
                player_fields_config
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, config.name, config.teamsCount, config.duration,
                config.hasReturnMatch || 0, config.hasPlayoffs || 0, 
                config.playoffTeams || 4, config.playoffFormat || 'single', 
                config.startDate, JSON.stringify(config.selectedVenues), inviteToken,
                fieldsConfig
            ]
        );
        const leagueId = leagueResult.insertId;

        const teamIdsMap = {};
        for (const team of config.teams) {
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const [tResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, team.name.trim(), teamToken, team.phone || null]
            );
            teamIdsMap[team.name.trim()] = tResult.insertId;
        }

        for (const v of config.selectedVenues) {
            await connection.execute(
                `INSERT INTO venues (name, address, city, created_by) VALUES (?, ?, ?, ?)`,
                [v.name.trim(), v.address || '', v.city || '', adminId]
            );
        }

        if (schedule && schedule.length > 0) {
            const matchData = schedule.map(item => [
                leagueId, 
                teamIdsMap[item.match.home.trim()] || null, 
                teamIdsMap[item.match.away.trim()] || null, 
                null, // venue_id simplificado
                item.dateStr, 
                item.time
            ]);
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

// 5. ACTUALIZAR EQUIPO
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

// 6. VER PLANTILLA
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

// 7.SUSTITUYE LA RUTA 7 EN league.routes.js
// server/routes/league.routes.js

router.post('/claim-team', verifyToken, async (req, res) => {
    const { teamId } = req.body;
    // 💡 Triple check del ID para que no llegue NULL a la DB
    const userId = req.user.id || req.user.adminId || req.user.userId;

    try {
        if (!userId) return res.status(401).json({ message: "Usuario no identificado" });

        // Verificamos si ya hay capitán
        const [team] = await pool.execute('SELECT captain_id, name FROM league_teams WHERE id = ?', [teamId]);
        if (team.length === 0) return res.status(404).json({ message: "Equipo no encontrado" });
        if (team[0].captain_id !== null) return res.status(400).json({ message: "Este equipo ya tiene capitán" });

        // ACTUALIZAMOS LA TABLA league_teams
        await pool.execute('UPDATE league_teams SET captain_id = ? WHERE id = ?', [userId, teamId]);
        
        console.log(`✅ User ${userId} vinculado al equipo ${teamId}`);
        res.json({ success: true, message: `¡Ahora eres el capitán de ${team[0].name}!` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 8. REGISTRO JUGADOR
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

// 9. CHECK REQUISITOS
router.get('/check-requirements/:leagueId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.execute(
            'SELECT fullName, dni, phone, photo_url, age FROM users WHERE id = ?',
            [userId]
        );
        const user = users[0];

        const [leagues] = await pool.execute(
            'SELECT player_fields_config FROM leagues WHERE id = ?',
            [req.params.leagueId]
        );
        
        if (leagues.length === 0) return res.status(404).json({ message: "Liga no encontrada" });
        
        const config = JSON.parse(leagues[0].player_fields_config);
        const missingFields = [];

        if (config.dni && !user.dni) missingFields.push('dni');
        if (config.photo && !user.photo_url) missingFields.push('photo');
        if (config.phone && !user.phone) missingFields.push('phone');
        if (config.age && !user.age) missingFields.push('age');

        res.json({
            isComplete: missingFields.length === 0,
            missingFields,
            user
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;