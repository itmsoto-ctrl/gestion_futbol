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


// 2. DETALLE DE LIGA, EQUIPOS Y JUGADORES (Visión Modo ... - Adaptado a DB Real)
// 2. DETALLE DE LIGA, EQUIPOS Y JUGADORES (Visión Modo Dios)
router.get('/league-details/:id', verifyToken, async (req, res) => {
    try {
        const identifier = req.params.id;

        const [leagues] = await pool.execute(
            'SELECT * FROM leagues WHERE id = ? OR invite_token = ?',
            [identifier, identifier]
        );

        if (leagues.length === 0) {
            return res.status(404).json({ message: "Liga no encontrada" });
        }

        const realLeagueId = leagues[0].id;

        // 1. Extraemos los equipos (Usando el nombre exacto de tu columna: 'logo')
        const [teams] = await pool.execute(
            `SELECT 
                id, name, logo, team_token AS invite_token, captain_phone
             FROM league_teams 
             WHERE league_id = ?`,
            [realLeagueId]
        );

        // 2. Extraemos los jugadores
        const [players] = await pool.execute(
            `SELECT 
                p.team_id, p.dorsal, p.is_captain, p.full_name AS fullName, p.dni, p.photo_url
             FROM league_players p
             JOIN league_teams t ON p.team_id = t.id
             WHERE t.league_id = ?`,
            [realLeagueId]
        );

        const teamsWithPlayers = teams.map(team => ({
            ...team,
            player_count: players.filter(p => p.team_id === team.id).length,
            players: players.filter(p => p.team_id === team.id)
        }));

        res.json({ league: leagues[0], teams: teamsWithPlayers });

    } catch (error) {
        console.error("🚨 Error en league-details:", error);
        res.status(500).json({ error: error.message });
    }
});


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

// 4. CREAR LIGA (VERSIÓN CON PROTECCIÓN DE SEDES DUPLICADAS)
router.post('/create', verifyToken, async (req, res) => {
    const { 
        name, teamsCount, duration, hasReturnMatch, hasPlayoffs, 
        playoffTeams, playoffFormat, startDate, selectedVenues, 
        registrationConfig, teams, schedule 
    } = req.body;

    const adminId = req.user.id || req.user.adminId || req.user.userId;
    const inviteToken = crypto.randomBytes(5).toString('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        const fieldsConfig = JSON.stringify(registrationConfig || {});

        // 1. GESTIÓN INTELIGENTE DE SEDES (Evitar duplicados)
        const venueIdsMap = {};
        for (const venue of selectedVenues) {
            // Si viene del Modal (creada a mano)
            if (venue.isNew || String(venue.id).startsWith('new_')) {
                const [vResult] = await connection.execute(
                    `INSERT INTO venues (name, address, city) VALUES (?, ?, ?)`,
                    [venue.name, venue.address, venue.city]
                );
                venueIdsMap[venue.id] = vResult.insertId; // Guardamos el ID real de MySQL
            } else {
                // Si viene del buscador (ya existe)
                venueIdsMap[venue.id] = venue.id; 
            }
        }

        // Actualizamos el JSON de sedes con los IDs reales para guardarlo en la liga
        const finalVenues = selectedVenues.map(v => ({
            ...v,
            id: venueIdsMap[v.id],
            isNew: false // Limpiamos la bandera
        }));

        // 2. CREAMOS LA LIGA
        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (
                admin_id, name, teams_count, match_minutes, 
                has_return_match, has_playoffs, playoff_teams, 
                playoff_format, start_date, playing_days, invite_token,
                player_fields_config
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, name, teamsCount, duration,
                hasReturnMatch ? 1 : 0, hasPlayoffs ? 1 : 0, 
                playoffTeams || 4, playoffFormat || 'single', 
                startDate, JSON.stringify(finalVenues), inviteToken,
                fieldsConfig
            ]
        );
        const leagueId = leagueResult.insertId;

        // 3. CREAMOS LOS EQUIPOS 
        const teamIdsMap = {};
        for (const team of teams) {
            const teamToken = crypto.randomBytes(3).toString('hex').toUpperCase(); 
            const [tResult] = await connection.execute(
                `INSERT INTO league_teams (league_id, name, team_token, captain_phone) VALUES (?, ?, ?, ?)`,
                [leagueId, team.name.trim(), teamToken, team.phone || null]
            );
            teamIdsMap[team.name.trim()] = tResult.insertId;
        }

        // 4. CREAMOS EL CALENDARIO (Mapeando sedes y equipos a sus IDs reales)
       // 4. CREAR EL CALENDARIO (Mapeando sedes y equipos a sus IDs reales)
       if (schedule && schedule.length > 0) {
        const matchData = schedule.map(item => {
            // Usamos || null para que los "Finalista A" o "1º Clasif" no rompan el servidor
            const homeId = teamIdsMap[item.match.home.trim()] || null;
            const awayId = teamIdsMap[item.match.away.trim()] || null;
            
            // La sede sí o sí tiene que existir
            const realVenueId = venueIdsMap[item.venue_id]; 

            if (!realVenueId) {
                throw new Error(`Sede no encontrada para el partido del ${item.dateStr}`);
            }

            return [
                leagueId, 
                homeId, 
                awayId, 
                realVenueId, 
                item.dateStr, 
                item.time
            ];
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
        console.error("🚨 Error creando liga:", error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 5. VER columnas
// 5. ACTUALIZAR EQUIPO (LOGO Y TELÉFONO)
router.patch('/teams/:id', verifyToken, async (req, res) => {
    const teamId = req.params.id;
    const { logo_url, captain_phone } = req.body;

    // 🔍 LOGS PARA RAILWAY (Mira la consola de Railway al pulsar guardar)
    console.log(`>>> ACTUALIZANDO EQUIPO ID: ${teamId}`);
    console.log(`>>> DATA RECIBIDA: logo=${logo_url}, phone=${captain_phone}`);

    try {
        // Usamos una consulta directa para evitar fallos de desestructuración
        const sql = "UPDATE league_teams SET logo = ?, captain_phone = ? WHERE id = ?";
        const params = [logo_url || null, captain_phone || null, teamId];

        const [result] = await pool.execute(sql, params);

        if (result.affectedRows === 0) {
            console.error("❌ No se encontró el equipo para actualizar");
            return res.status(404).json({ error: "Equipo no encontrado" });
        }

        console.log("✅ UPDATE EXITOSO EN DB");
        return res.json({ success: true, message: "Actualizado correctamente" });

    } catch (error) {
        console.error("🚨 ERROR CRÍTICO EN UPDATE:", error.message);
        return res.status(500).json({ error: error.message });
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