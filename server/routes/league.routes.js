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

// 2. DETALLE DE LIGA (Equipos y Jugadores con estado PWA real)
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
            `SELECT 
                lp.team_id, 
                lp.id, 
                lp.dorsal, 
                lp.full_name AS fullName, 
                lp.dni, 
                lp.photo_url, 
                lp.is_captain, 
                u.is_pwa 
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

// 3. CREAR LIGA (Con generación automática de tokens y calendario)
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

// 🎖️ 4. ASIGNAR/QUITAR CAPITÁN
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

// ⚽ 5. REPORTAR/VALIDAR/IMPUGNAR MARCADOR (Fase Crítica de Capitanes)
router.post('/matches/:matchId/report-score', verifyToken, async (req, res) => {
    const { matchId } = req.params;
    const { score_home, score_away, action } = req.body; 
    const userId = req.user.id;

    try {
        const [perm] = await pool.execute(
            `SELECT m.* FROM league_matches m
             JOIN league_players lp ON (lp.team_id = m.home_team_id OR lp.team_id = m.away_team_id)
             WHERE m.id = ? AND lp.user_id = ? AND lp.is_captain = 1`,
            [matchId, userId]
        );

        if (perm.length === 0) return res.status(403).json({ error: "No tienes permisos de capitán para este acta" });

        const match = perm[0];

        if (action === 'PROPOSE') {
            await pool.execute(
                `UPDATE league_matches 
                 SET score_home = ?, score_away = ?, status = 'awaiting_validation', score_proposer_id = ? 
                 WHERE id = ?`,
                [score_home, score_away, userId, matchId]
            );
            return res.json({ success: true, message: "Resultado enviado para validación" });

        } else if (action === 'VALIDATE') {
            if (Number(match.score_proposer_id) === Number(userId)) {
                return res.status(403).json({ error: "Debes esperar a que el capitán rival valide el resultado" });
            }

            await pool.execute(
                `UPDATE league_matches SET status = 'finished' WHERE id = ?`,
                [matchId]
            );
            return res.json({ success: true, message: "Acta cerrada y confirmada" });

        } else if (action === 'REJECT') {
            if (Number(match.score_proposer_id) === Number(userId)) {
                return res.status(403).json({ error: "No puedes impugnar tu propia propuesta" });
            }

            await pool.execute(
                `UPDATE league_matches 
                 SET status = 'awaiting_score', score_proposer_id = NULL 
                 WHERE id = ?`,
                [matchId]
            );
            return res.json({ success: true, message: "Resultado rechazado. El acta vuelve a estar abierta para corrección." });
        }

        res.status(400).json({ error: "Acción no reconocida" });
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
        
        res.json(matches.map(m => ({ ...m, match_date: m.match_date ? new Date(m.match_date).toISOString().split('T')[0] : null })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📅 8. OBTENER CALENDARIO DE UN EQUIPO (PlayerHome)
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
        res.status(500).json({ error: error.message });
    }
});

// 🚨 NUKE (Limpieza Total de la Liga)
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
        res.json({ message: "Base de datos reseteada con éxito" });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

// 🔍 BUSCAR PARTIDO PENDIENTE DE ACTA (Uso Público/App)
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
        res.status(500).json({ error: error.message });
    }
});

// 👥 9. OBTENER PLANTILLA DE UN EQUIPO (🛠️ REPARADO: Se eliminó u.age inexistente)
router.get('/teams/:teamId/players', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;
        const [players] = await pool.execute(
            `SELECT 
                lp.id, 
                lp.team_id, 
                lp.user_id, 
                lp.full_name,
                lp.full_name AS name,
                lp.full_name AS fullName,
                lp.dorsal, 
                lp.is_captain,
                u.dni, 
                u.phone, 
                COALESCE(u.photo_url, lp.photo_url) AS photo_url,
                u.position,
                u.is_pwa 
             FROM league_players lp
             LEFT JOIN users u ON lp.user_id = u.id
             WHERE lp.team_id = ?`,
            [teamId]
        );
        res.json(players);
    } catch (error) {
        console.error("🚨 Error al cargar plantilla:", error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// PORTAL DE INVITACIÓN (Carga el equipo)
// ==========================================
router.get('/team-portal/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.execute(`
            SELECT t.id, t.name as teamName, t.logo, l.name as leagueName, l.id as league_id, l.player_fields_config
            FROM league_teams t
            JOIN leagues l ON t.league_id = l.id
            WHERE t.team_token = ?`, [token]);

        if (rows.length === 0) return res.status(404).json({ message: "Enlace no válido" });

        const team = rows[0];
        res.json({
            team: {
                id: team.id,
                teamName: team.teamName,
                logo: team.logo,
                leagueName: team.leagueName,
                league_id: team.league_id
            },
            fieldsConfig: JSON.parse(team.player_fields_config || '{}')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// FICHAJE COMPLETO (Guarda al jugador)
// ==========================================
router.post('/register-player-full', async (req, res) => {
    const { email, fullName, teamId, dorsal, dni, phone } = req.body; 
    
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.execute(
            `UPDATE users SET dni = ?, phone = ? WHERE email = ?`,
            [dni || null, phone || null, email]
        );

        const [users] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) throw new Error("Usuario no encontrado");
        const userId = users[0].id;

        await connection.execute(
            `INSERT INTO league_players (team_id, user_id, full_name, dorsal, dni) 
             VALUES (?, ?, ?, ?, ?)`,
            [teamId, userId, fullName, dorsal || null, dni || null]
        );

        await connection.commit();
        res.json({ success: true, message: "¡Fichaje completado con éxito!" });

    } catch (error) {
        await connection.rollback();
        console.error("🚨 Error en registro (Query Fallida):", error.message);
        res.status(500).json({ error: "No se pudo completar el registro: " + error.message });
    } finally {
        connection.release();
    }
});

// 🔍 10. OBTENER SCOUTING DEL PRÓXIMO RIVAL
router.get('/scouting-next-rival/:teamId', verifyToken, async (req, res) => {
    try {
        const { teamId } = req.params;

        // 1. Buscamos el próximo partido (el primero que no haya terminado)
        const [nextMatch] = await pool.execute(`
            SELECT id, home_team_id, away_team_id, match_date, match_time
            FROM league_matches
            WHERE (home_team_id = ? OR away_team_id = ?) 
              AND status != 'finished'
            ORDER BY match_date ASC, match_time ASC
            LIMIT 1
        `, [teamId, teamId]);

        if (nextMatch.length === 0) {
            return res.json({ message: "No hay partidos próximos", rivals: [] });
        }

        // 2. Identificamos cuál de los dos es el ID del rival
        const rivalId = nextMatch[0].home_team_id == teamId 
            ? nextMatch[0].away_team_id 
            : nextMatch[0].home_team_id;

        /// 3. Obtenemos los jugadores del rival (sin u.stats que no existe aún)
        const [rivals] = await pool.execute(`
            SELECT 
                lp.id, 
                lp.full_name AS name,
                u.position,
                COALESCE(u.photo_url, lp.photo_url) AS photo_url,
                u.country_code,
                t.logo AS team_logo
            FROM league_players lp
            JOIN league_teams t ON lp.team_id = t.id
            LEFT JOIN users u ON lp.user_id = u.id
            WHERE lp.team_id = ?
        `, [rivalId]);

        // Formateamos y añadimos stats por defecto (60) para que la pizarra cargue
        const formattedRivals = rivals.map(r => {
            // Stats por defecto mientras no existan en DB
            const defaultStats = { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
            
            return {
                ...r,
                position: r.position || 'MC', // Evitamos que sea null para la pizarra
                stats: defaultStats,
                rating: 60 
            };
        });

        res.json({ 
            matchInfo: nextMatch[0],
            rivalId: rivalId,
            rivals: formattedRivals 
        });

    } catch (error) {
        console.error("🚨 Error en Scouting:", error);
        res.status(500).json({ error: error.message });
    }
});

// Función auxiliar para calcular la media de la carta si no existe
function calculateRating(stats) {
    if (!stats) return 60;
    const s = typeof stats === 'string' ? JSON.parse(stats) : stats;
    const values = [s.pac, s.sho, s.pas, s.dri, s.def, s.phy];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.round(avg);
}

module.exports = router;