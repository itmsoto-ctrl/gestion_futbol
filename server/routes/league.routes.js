const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth.middleware');
const crypto = require('crypto');

// 1. OBTENER LIGAS DEL ADMIN (Dashboard General)

router.get('/my-leagues', verifyToken, async (req, res) => {
    try {
        // 💡 DEBUG: Mira esto en los logs de Railway para saber el nombre exacto
        console.log("CONTENIDO DEL TOKEN DECODIFICADO:", req.user);

        // Intenta pillar 'id', si no 'adminId', si no 'userId'
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
        // ... resto del error
    }
});

// 2. DETALLE DE LIGA (Soporta Token de texto o ID numérico)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const identifier = req.params.id; // Aquí llega '4f127af4f8'
        
        console.log("-----------------------------------------");
        console.log("🔎 BUSCANDO DETALLE DE LIGA:", identifier);

        // Buscamos en la tabla leagues por el campo invite_token O por el id
        const [leagueRows] = await pool.execute(
            'SELECT * FROM leagues WHERE invite_token = ? OR id = ?',
            [identifier, identifier]
        );

        if (leagueRows.length === 0) {
            console.log("❌ LIGA NO ENCONTRADA EN DB");
            return res.status(404).json({ message: "Liga no encontrada" });
        }

        const league = leagueRows[0];
        console.log("✅ LIGA ENCONTRADA:", league.name);

        // Ahora buscamos los equipos vinculados a esa liga
        const [teams] = await pool.execute(
            `SELECT id, name, team_token, captain_phone, captain_id, logo,
            (SELECT COUNT(*) FROM league_players WHERE team_id = league_teams.id) as player_count
            FROM league_teams WHERE league_id = ?`,
            [league.id]
        );

        console.log(`⚽ EQUIPOS CARGADOS: ${teams.length}`);
        
        res.json({ ...league, teams });

    } catch (error) {
        console.error("🚨 ERROR EN DETALLE LIGA:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 3. PORTAL INTELIGENTE (Público) - Versión Blindada
router.get('/team-portal/:token', async (req, res) => {
    try {
        const [teams] = await pool.execute(
            `SELECT t.id, t.name as teamName, t.captain_id, 
                    l.name as leagueName, l.id as leagueId, 
                    l.player_fields_config,
                    u.username as adminName
             FROM league_teams t 
             JOIN leagues l ON t.league_id = l.id 
             JOIN users u ON l.admin_id = u.id 
             WHERE t.team_token = ?`,
            [req.params.token]
        );

        if (teams.length === 0) return res.status(404).json({ message: "Enlace no válido" });

        const team = teams[0];

        // 🔍 DEBUG: Mira esto en la terminal de tu VS Code / Mac
        console.log("-----------------------------------------");
        console.log(`⚽ PORTAL VORA - Equipo: ${team.teamName}`);
        console.log(`👤 Captain_ID en DB: [${team.captain_id}]`);
        console.log(`🤔 Tipo de dato: ${typeof team.captain_id}`);

        // Lógica ultra-segura: 
        // Si es null, undefined, 0 o string vacío, es CAPTAIN_INVITE
        const isCaptainMissing = (
            team.captain_id === null || 
            team.captain_id === undefined || 
            team.captain_id === 0 || 
            team.captain_id === ""
        );

        const type = isCaptainMissing ? 'CAPTAIN_INVITE' : 'PLAYER_REGISTRATION';
        
        console.log(`🚩 Resultado Lógica: ${type}`);
        console.log("-----------------------------------------");

        res.json({ 
            type, 
            team,
            adminName: team.adminName,
            fieldsConfig: team.player_fields_config ? JSON.parse(team.player_fields_config) : {} 
        });
    } catch (error) {
        console.error("🚨 Error en Portal:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 4. CREAR LIGA (Proceso de inicialización masiva)
// MODIFICADO: Ahora guarda player_fields_config en la tabla leagues
router.post('/create', verifyToken, async (req, res) => {
    const { config, schedule } = req.body;
    const adminId = req.user.id;
    const inviteToken = crypto.randomBytes(5).toString('hex');
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Guardamos la configuración de campos como un String JSON
        const fieldsConfig = JSON.stringify(config.registrationConfig);

        // A. Insertar Liga (Añadida la columna player_fields_config)
        const [leagueResult] = await connection.execute(
            `INSERT INTO leagues (
                admin_id, name, teams_count, match_minutes, 
                has_return_match, has_playoffs, playoff_teams, 
                playoff_format, start_date, playing_days, invite_token,
                player_fields_config -- ✅ Nueva columna
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                adminId, config.name, config.teamsCount, config.duration,
                config.hasReturnMatch || 0, config.hasPlayoffs || 0, 
                config.playoffTeams || 4, config.playoffFormat || 'single', 
                config.startDate, JSON.stringify(config.selectedVenues), inviteToken,
                fieldsConfig // ✅ Valor insertado
            ]
        );
        const leagueId = leagueResult.insertId;

        // B. Insertar Equipos (Igual)
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

        // C. Insertar Sedes (Igual)
        const venueIdsMap = {};
        for (const v of config.selectedVenues) {
            const cleanVenueName = v.name.trim();
            const [vResult] = await connection.execute(
                `INSERT INTO venues (name, address, city, created_by) VALUES (?, ?, ?, ?)`,
                [cleanVenueName, v.address || '', v.city || '', adminId]
            );
            venueIdsMap[cleanVenueName] = vResult.insertId;
        }

        // D. Insertar Partidos (Igual)
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
        console.error("🚨 Error al crear liga:", error.message);
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

// Esta ruta se llama después de que el usuario haga Login o Registro
router.get('/check-requirements/:leagueId', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const leagueId = req.params.leagueId;

        // 1. Obtenemos los datos actuales del usuario
        const [users] = await pool.execute(
            'SELECT fullName, dni, phone, photo_url, age FROM users WHERE id = ?',
            [userId]
        );
        const user = users[0];

        // 2. Obtenemos los requisitos de la liga
        const [leagues] = await pool.execute(
            'SELECT player_fields_config FROM leagues WHERE id = ?',
            [leagueId]
        );
        
        if (leagues.length === 0) return res.status(404).json({ message: "Liga no encontrada" });
        
        const config = JSON.parse(leagues[0].player_fields_config);
        const missingFields = [];

        // 3. LA LÓGICA DE CRUCE: Comprobamos qué falta
        if (config.dni && !user.dni) missingFields.push('dni');
        if (config.photo && !user.photo_url) missingFields.push('photo');
        if (config.phone && !user.phone) missingFields.push('phone');
        if (config.age && !user.age) missingFields.push('age');
        // El dorsal no se comprueba aquí porque va en la tabla de 'league_players', no en 'users'

        res.json({
            isComplete: missingFields.length === 0,
            missingFields: missingFields,
            user: user // Devolvemos los datos que ya tenemos para no pedirlos otra vez
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;