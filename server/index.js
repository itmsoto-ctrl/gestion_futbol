require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306
});

const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password], (err, result) => {
        if (result && result.length > 0) res.send(result[0]); else res.status(401).send("Error");
    });
});

app.get('/tournaments', (req, res) => { db.query('SELECT * FROM tournaments', (err, r) => res.send(r)); });

// --- RESET MAESTRO MODULAR (Búsqueda estricta) ---
app.post('/reset-tournament/:id', (req, res) => {
    const tId = req.params.id;
    const { target } = req.body; 
    if (target === 'all') {
        db.query('DELETE FROM goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
            db.query('DELETE FROM matches WHERE tournament_id = ? AND phase != "grupo"', [tId], () => {
                db.query('UPDATE matches SET played = 0, team_a_goals = 0, team_b_goals = 0 WHERE tournament_id = ?', [tId], () => res.send("OK"));
            });
        });
    } else {
        // Aquí usamos comparación exacta (=) en lugar de LIKE para no borrar semis al querer borrar la final
        db.query('DELETE FROM matches WHERE tournament_id = ? AND phase = ?', [tId, target], (err) => res.send("OK"));
    }
});

app.get('/matches/:tId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m LEFT JOIN teams t1 ON m.team_a_id = t1.id LEFT JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC, m.id ASC`;
    db.query(sql, [req.params.tId], (err, r) => res.send(r));
});

app.put('/matches/:id', (req, res) => {
    const { team_a_goals, team_b_goals, played, referee, match_date } = req.body;
    
    // 1. Formateamos la fecha normal del partido
    const date = match_date ? match_date.replace('T', ' ').slice(0, 19) : null;

    // 2. LÓGICA DE VOTACIÓN:
    // Si 'played' viene como true (o 1), calculamos 20 minutos desde AHORA.
    // Si no, lo dejamos como null.
    let votings_end_at = null;
    if (played === true || played === 1 || played === "true") {
        const ahora = new Date();
        const fechaFin = new Date(ahora.getTime() + 20 * 60000); // +20 minutos
        votings_end_at = fechaFin.toISOString().slice(0, 19).replace('T', ' ');
    }

    // 3. ACTUALIZACIÓN SQL: Añadimos votings_end_at a la consulta
    const sql = 'UPDATE matches SET team_a_goals=?, team_b_goals=?, played=?, referee=?, match_date=?, votings_end_at=? WHERE id=?';
    const params = [team_a_goals, team_b_goals, played, referee, date, votings_end_at, req.params.id];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Error al actualizar partido:", err);
            return res.status(500).send(err);
        }
        res.send("OK");
    });
});

app.post('/add-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    db.query('INSERT INTO goals (match_id, player_id, team_id) VALUES (?, ?, ?)', [match_id, player_id, team_id], () => {
        db.query(`UPDATE matches SET ${team_side} = ${team_side} + 1 WHERE id = ?`, [match_id], () => res.send("OK"));
    });
});

app.post('/remove-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    db.query('DELETE FROM goals WHERE match_id = ? AND player_id = ? AND team_id = ? ORDER BY id DESC LIMIT 1', [match_id, player_id, team_id], (err, result) => {
        if (result && result.affectedRows > 0) {
            db.query(`UPDATE matches SET ${team_side} = CASE WHEN ${team_side} > 0 THEN ${team_side} - 1 ELSE 0 END WHERE id = ?`, [match_id], () => res.send("OK"));
        } else res.status(404).send("Error");
    });
});

app.post('/activate-phase/:id', (req, res) => {
    const tId = req.params.id;
    const { phase, pairings } = req.body;
    db.query('SELECT MAX(match_date) as last FROM matches WHERE tournament_id = ?', [tId], (err, r) => {
        let start = r[0].last ? new Date(new Date(r[0].last).getTime() + 30*60000) : new Date();
        const matchesArr = pairings.map((p, i) => {
            let mt = new Date(start);
            if (phase === 'cuartos' && (i === 2 || i === 3)) mt.setMinutes(mt.getMinutes() + 30);
            return [tId, p.a, p.b, formatDate(mt), p.field, phase];
        });
        db.query('INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?', [matchesArr], (errIns) => res.send("OK"));
    });
});

app.get('/teams/:tId', (req, res) => { db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); });
app.get('/players/:tId', (req, res) => { db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); });
app.post('/players', (req, res) => { db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], () => res.send("OK")); });
app.get('/goals/:tId', (req, res) => { db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tId], (err, r) => res.send(r || [])); });
app.get('/stats/:tId', (req, res) => {
    const tId = req.params.tId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => { db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] })); });
});
// RUTA PARA GUARDAR VOTOS MVP
// RUTA PARA GUARDAR LOS VOTOS EN RAILWAY
app.post('/submit-votes', (req, res) => {
    const { match_id, voter_id, votes } = req.body; 

    if (!match_id || !voter_id || !votes || votes.length < 5) {
        return res.status(400).send("Faltan datos o votos incompletos");
    }

    // 1. Verificamos si este usuario ya votó en este partido
    const checkSql = 'SELECT * FROM votes WHERE match_id = ? AND voter_id = ?';
    db.query(checkSql, [match_id, voter_id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) return res.status(400).send("Ya has votado en este partido");

        // 2. Preparamos los datos para insertar (Array de Arrays)
        const values = votes.map(v => [match_id, voter_id, v.player_id, v.points]);

        // 3. Insertamos los 5 votos de una sola vez
        const sql = 'INSERT INTO votes (match_id, voter_id, player_id, points) VALUES ?';
        db.query(sql, [values], (err, result) => {
            if (err) {
                console.error("Error MySQL:", err);
                return res.status(500).send(err);
            }
            res.send("¡Votación guardada con éxito!");
        });
    });
});

// RUTA PARA OBTENER EL RATING ACTUALIZADO DE UN JUGADOR
app.get('/player-rating/:id', (req, res) => {
    const playerId = req.params.id;
    // Fórmula: 60 base + puntos de votos
    const sql = `
        SELECT p.*, 
        (60 + COALESCE(SUM(v.points), 0)) as current_rating 
        FROM players p 
        LEFT JOIN votes v ON p.id = v.player_id 
        WHERE p.id = ?
    `;
    db.query(sql, [playerId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]);
    });
});

// --- RUTA PARA GUARDAR VOTOS MVP (Añadir a index.js en el server) ---
app.post('/submit-votes', (req, res) => {
    const { match_id, voter_id, votes } = req.body; 

    // Validación de seguridad
    if (!match_id || !voter_id || !votes || votes.length < 5) {
        return res.status(400).send("Datos incompletos para la votación");
    }

    // 1. Verificamos si este jugador ya votó en este partido
    const checkSql = 'SELECT * FROM votes WHERE match_id = ? AND voter_id = ?';
    db.query(checkSql, [match_id, voter_id], (err, results) => {
        if (err) return res.status(500).send("Error en la base de datos");
        
        if (results.length > 0) {
            return res.status(400).send("Lo sentimos, ya has votado en este partido anteriormente.");
        }

        // 2. Preparamos los datos (MySQL espera un Array de Arrays para el insert masivo)
        const values = votes.map(v => [
            match_id, 
            voter_id, 
            v.player_id, 
            v.points
        ]);

        // 3. Insertamos los 5 votos de una sola vez
        const sql = 'INSERT INTO votes (match_id, voter_id, player_id, points) VALUES ?';
        
        db.query(sql, [values], (err, result) => {
            if (err) {
                console.error("Error al insertar votos:", err);
                return res.status(500).send("Fallo al registrar los votos");
            }
            res.send("¡Votos registrados correctamente!");
        });
    });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("🚀 v3.9.3 ready"));