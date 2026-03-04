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

// 4. CREAR LIGA (Versión Blindada)
router.post('/create', verifyToken, async (req, res) => {
    // 🛡️ 1. Valores por defecto para evitar undefined
    const name = req.body.name || 'Liga Sin Nombre';
    const teamsCount = req.body.teamsCount || 0;
    const duration = req.body.duration || 60;
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const selectedVenues = req.body.selectedVenues || [];
    const registrationConfig = req.body.registrationConfig || {};
    const teams = req.body.teams || [];
    const schedule = req.body.schedule || [];
    
    // 🛡️ 2. Protección del ID de administrador
    const adminId = req.user?.id || req.user?.adminId || req.user?.userId || null; 

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const inviteToken = crypto.randomBytes(5).toString('hex');
        const fieldsConfig = JSON.stringify(registrationConfig);

        // 🛡️ 3. Insertar Liga (Asegurando que no hay undefined en el JSON)
        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (admin_id, name, teams_count, match_minutes, start_date, playing_days, invite_token, player_fields_config) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, name, teamsCount, duration, startDate, JSON.stringify(selectedVenues), inviteToken, fieldsConfig]
        );
        const leagueId = leagueResult.insertId;

        const teamIdMap = {}; 

        for (const team of teams) {
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const teamName = team.name ? team.name.trim() : 'Equipo Desconocido';
            const teamPhone = team.phone || null; // Forzamos null explícito
            
            const [teamResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, teamName, teamToken, teamPhone]
            );
            
            // Atrapamos el ID temporal ya venga como temp_id o como id
            const mappedId = team.temp_id !== undefined ? team.temp_id : team.id;
            teamIdMap[mappedId] = teamResult.insertId; 
        }

        if (schedule && schedule.length > 0) {
            for (const match of schedule) {
                // 🛡️ 4. Protección al leer el calendario (por si home/away son objetos o enteros)
                const homeTempId = typeof match.home === 'object' ? match.home?.id : match.home;
                const awayTempId = typeof match.away === 'object' ? match.away?.id : match.away;

                // Si no encuentra el mapeo, forzamos null (?? null) en vez de undefined
                const realHomeId = teamIdMap[homeTempId] ?? null; 
                const realAwayId = teamIdMap[awayTempId] ?? null;
                
                const matchDate = match.date || startDate;
                const matchVenue = match.venue || 'Por definir';

                await connection.execute(
                    `INSERT INTO league_matches (league_id, home_team_id, away_team_id, match_date, venue_name) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [leagueId, realHomeId, realAwayId, matchDate, matchVenue]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ message: "Liga creada", leagueId });
    } catch (error) {
        await connection.rollback();
        console.error("🚨 Error al crear la liga:", error);
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

// 7. VINCULAR JUGADOR EXISTENTE A EQUIPO (Fase 3 del registro)
router.post('/register-player-full', async (req, res) => {
    const { email, fullName, dorsal, dni, teamId, phone, photoUrl } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener el ID del usuario
        const [uRows] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (uRows.length === 0) throw new Error("Usuario no encontrado");
        const userId = uRows[0].id;

        // 2. ACTUALIZAR TABLA 'users' (Datos de identidad global)
        // Usamos COALESCE para no borrar datos si vienen vacíos
        await connection.execute(
            `UPDATE users SET 
                dni = IFNULL(?, dni), 
                phone = IFNULL(?, phone), 
                photo_url = IFNULL(?, photo_url),
                name = IFNULL(?, name)
             WHERE id = ?`,
            [dni || null, phone || null, photoUrl || null, fullName || null, userId]
        );

        // 3. INSERTAR EN 'league_players' (Datos puramente deportivos)
        // Verificamos si ya existe la relación
        const [existing] = await connection.execute(
            'SELECT id FROM league_players WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (existing.length === 0) {
            await connection.execute(
                `INSERT INTO league_players 
                (team_id, user_id, full_name, dorsal, status, is_pwa) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [teamId, userId, fullName, dorsal || null, 'active', 1]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: "Perfil y Fichaje actualizados" });

    } catch (error) {
        await connection.rollback();
        console.error("🚨 Error en Fichaje Maestro:", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 🚨 RUTA DE TEST: BOTÓN DEL PÁNICO (Borrar todo)
router.delete('/nuke-database', verifyToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Desactivamos las restricciones de foreign keys para poder vaciar a lo bestia
        await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 2. Vaciamos todas las tablas relacionadas con ligas y reseteamos los IDs a 1
        await connection.execute('TRUNCATE TABLE league_matches');
        await connection.execute('TRUNCATE TABLE league_players');
        await connection.execute('TRUNCATE TABLE league_teams');
        await connection.execute('TRUNCATE TABLE leagues');

        // 3. Volvemos a activar la seguridad de la base de datos
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

        await connection.commit();
        res.json({ message: "¡BOMBA NUCLEAR! Todas las ligas y equipos han sido eliminados. IDs reseteados a 1." });
    } catch (error) {
        await connection.rollback();
        console.error("Error al resetear la base de datos:", error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;