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

// 4. CREAR LIGA (Versión Diccionario Universal y Lectura Anidada)
router.post('/create', verifyToken, async (req, res) => {
    const name = req.body.name || 'Liga Sin Nombre';
    const teamsCount = req.body.teamsCount || 0;
    const duration = req.body.duration || 60;
    const startDate = req.body.startDate || new Date().toISOString().split('T')[0];
    const selectedVenues = req.body.selectedVenues || [];
    const registrationConfig = req.body.registrationConfig || {};
    const teams = req.body.teams || [];
    const schedule = req.body.schedule || [];
    
    const adminId = req.user?.id || req.user?.adminId || req.user?.userId || null; 

    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const inviteToken = crypto.randomBytes(5).toString('hex');
        const fieldsConfig = JSON.stringify(registrationConfig);

        // 1. Insertamos Liga
        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (admin_id, name, teams_count, match_minutes, start_date, playing_days, invite_token, player_fields_config) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [adminId, name, teamsCount, duration, startDate, JSON.stringify(selectedVenues), inviteToken, fieldsConfig]
        );
        const leagueId = leagueResult.insertId;

        // 2. Insertamos Equipos y creamos el DICCIONARIO UNIVERSAL 🛡️
        const teamIdMap = {}; 

        for (let i = 0; i < teams.length; i++) {
            const team = teams[i];
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const teamName = team.name ? team.name.trim() : `Equipo ${i+1}`;
            
            const [teamResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, teamName, teamToken, team.phone || null]
            );
            
            const newTeamId = teamResult.insertId;
            
            // Guardamos todas las formas posibles en las que el frontend nos pueda llamar al equipo
            teamIdMap[i] = newTeamId;                                        // Por índice (0, 1, 2...)
            if (team.temp_id !== undefined) teamIdMap[team.temp_id] = newTeamId; // Por temp_id
            if (team.id !== undefined) teamIdMap[team.id] = newTeamId;           // Por id normal
            teamIdMap[teamName] = newTeamId;                                 // Por nombre ("Equipo 1", "Rayo", etc)
        }

        // 3. Insertamos el Calendario leyendo correctamente de match.match
        if (schedule && schedule.length > 0) {
            for (const item of schedule) {
                // ¡CORRECCIÓN! Los equipos vienen anidados dentro de item.match
                const matchData = item.match || {};
                
                // Extraemos las keys (0, 1... o los nombres)
                const homeKey = typeof matchData.home === 'object' ? (matchData.home?.id ?? matchData.home?.name) : matchData.home;
                const awayKey = typeof matchData.away === 'object' ? (matchData.away?.id ?? matchData.away?.name) : matchData.away;

                // Buscamos en el diccionario
                const realHomeId = teamIdMap[homeKey] ?? null; 
                const realAwayId = teamIdMap[awayKey] ?? null;
                
                // ¡CORRECCIÓN! Leemos la fecha de item.dateStr, la hora de item.time
                const mDate = item.dateStr || startDate;     
                const mTime = item.time || '00:00:00';    
                const vId = parseInt(item.venue_id) || 1;

                // Dentro del loop del schedule en POST /create
                await connection.execute(
                    `INSERT INTO league_matches (league_id, home_team_id, away_team_id, venue_id, pitch_name, match_date, match_time) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        leagueId, 
                        realHomeId, 
                        realAwayId, 
                        vId, 
                        item.pitch || item.field || null, // Captura el nombre del campo (ej. "Pista 1")
                        mDate, 
                        mTime
                    ]
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

//⚽ RUTA PARA EL CALENDARIO DEL EQUIPO
router.get('/my-calendar/:teamId', async (req, res) => {
    const { teamId } = req.params;
    try {
        // Usamos league_matches como indicaste y league_teams para los logos
        const [rows] = await pool.execute(
            `SELECT m.*, 
            t1.name as home_team, t1.logo as home_logo, 
            t2.name as away_team, t2.logo as away_logo 
            FROM league_matches m
            JOIN league_teams t1 ON m.home_team_id = t1.id
            JOIN league_teams t2 ON m.away_team_id = t2.id
            WHERE m.home_team_id = ? OR m.away_team_id = ?
            ORDER BY m.match_date ASC`, 
            [teamId, teamId]
        );
        
        res.json(rows);
    } catch (err) {
        console.error("Error en my-calendar:", err);
        res.status(500).json({ error: "Error al obtener el calendario" });
    }
});

module.exports = router;