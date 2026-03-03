const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN (Dashboard General)
router.get('/my-leagues', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.adminId || req.user.userId;
        if (!userId) return res.status(400).json({ error: "Token no válido" });

        const [rows] = await pool.execute(
            'SELECT id, name, invite_token, teams_count, match_minutes FROM leagues WHERE admin_id = ?',
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

// 4. CREAR LIGA (Con Gestión de Sedes y Equipos)
router.post('/create', verifyToken, async (req, res) => {
    const { name, teamsCount, duration, startDate, selectedVenues, registrationConfig, teams } = req.body;
    const adminId = req.user.id || req.user.adminId || req.user.userId;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const inviteToken = crypto.randomBytes(5).toString('hex');
        const fieldsConfig = JSON.stringify(registrationConfig || {});

        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (admin_id, name, teams_count, match_minutes, start_date, playing_days, invite_token, player_fields_config) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, name, teamsCount, duration, startDate, JSON.stringify(selectedVenues), inviteToken, fieldsConfig]
        );
        const leagueId = leagueResult.insertId;

        for (const team of teams) {
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, team.name.trim(), teamToken, team.phone || null]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Liga creada", leagueId });
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
        const [result] = await pool.execute(
            "UPDATE league_teams SET logo = ?, captain_phone = ? WHERE id = ?",
            [req.body.logo_url || null, req.body.captain_phone || null, req.params.id]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. VINCULAR CAPITÁN
router.post('/claim-team', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.adminId || req.user.userId;
        await pool.execute('UPDATE league_teams SET captain_id = ? WHERE id = ?', [userId, req.body.teamId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------
// 8. REGISTRO MAESTRO (Aquí ocurre la magia de las 2 tablas)
// -----------------------------------------------------------
router.post('/register-player-full', async (req, res) => {
    const { 
        email, password, fullName, dorsal, dni, 
        teamId, photoUrl, isNewUser 
    } = req.body;

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        let userId;

        if (isNewUser) {
            // 8.A CREAR EN TABLA 'users' (Para que exista globalmente)
            const [userResult] = await connection.execute(
                'INSERT INTO users (email, password, fullName, dni, photo_url, role) VALUES (?, ?, ?, ?, ?, ?)',
                [email, password, fullName, dni || null, photoUrl || null, 'player']
            );
            userId = userResult.insertId;
            console.log(`✅ Nuevo usuario creado ID: ${userId}`);
        } else {
            // 8.B OBTENER ID SI YA EXISTE
            const [userRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
            if (userRows.length === 0) throw new Error("El usuario debería existir pero no se encontró.");
            userId = userRows[0].id;
        }

        // 8.C VINCULAR A LA LIGA (Tabla 'league_players')
        // Verificamos duplicados en este equipo específico
        const [existing] = await connection.execute(
            'SELECT id FROM league_players WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (existing.length > 0) {
            throw new Error("Ya estás registrado en este equipo.");
        }

        await connection.execute(
            `INSERT INTO league_players 
            (team_id, user_id, full_name, dorsal, dni, photo_url, is_pwa) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [teamId, userId, fullName, dorsal, dni || null, photoUrl || null, 1]
        );

        await connection.commit();
        res.status(201).json({ success: true, message: "Fichaje estrella completado" });

    } catch (error) {
        await connection.rollback();
        console.error("🚨 Error en registro:", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 9. CHECK REQUISITOS (Para el flujo de completado de perfil)
router.get('/check-requirements/:leagueId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.execute('SELECT fullName, dni, photo_url FROM users WHERE id = ?', [userId]);
        const [leagues] = await pool.execute('SELECT player_fields_config FROM leagues WHERE id = ?', [req.params.leagueId]);
        
        const config = JSON.parse(leagues[0].player_fields_config || '{}');
        const missing = [];
        if (config.dni && !users[0].dni) missing.push('dni');
        if (config.photo && !users[0].photo_url) missing.push('photo');

        res.json({ isComplete: missing.length === 0, missingFields: missing, user: users[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/register-basic', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        // Importante: El 'role' debe ser 'user' según tu ENUM
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, name, role, active) VALUES (?, ?, ?, ?, ?)',
            [email, password, name, 'user', 1]
        );
        
        res.status(201).json({ 
            success: true, 
            message: "Usuario creado correctamente",
            userId: result.insertId 
        });
    } catch (error) {
        console.error("Error en register-basic:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Este email ya existe." });
        }
        res.status(500).json({ error: "Error en el servidor al insertar." });
    }
});

module.exports = router;