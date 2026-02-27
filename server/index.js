require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors()); 
app.use(express.json());

// Configuración del Pool de Conexión
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- AUTO-REPARACIÓN: Asegurar que la columna existe al arrancar ---
const ensureColumnExists = () => {
    const checkSql = "SHOW COLUMNS FROM matches LIKE 'votings_end_at'";
    db.query(checkSql, (err, results) => {
        if (err) {
            console.error("❌ Error al verificar columnas:", err.message);
            return;
        }
        if (results.length === 0) {
            console.log("⚠️ Columna 'votings_end_at' no encontrada. Creándola...");
            const alterSql = "ALTER TABLE matches ADD COLUMN votings_end_at DATETIME NULL DEFAULT NULL";
            db.query(alterSql, (err) => {
                if (err) console.error("❌ Error al crear la columna:", err.message);
                else console.log("✅ Columna 'votings_end_at' creada con éxito.");
            });
        } else {
            console.log("✅ Columna 'votings_end_at' verificada y lista.");
        }
    });
};

// Ejecutamos la verificación
ensureColumnExists();

const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// --- RUTAS ---

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password], (err, result) => {
        if (result && result.length > 0) res.send(result[0]); else res.status(401).send("Error");
    });
});

app.get('/tournaments', (req, res) => { db.query('SELECT * FROM tournaments', (err, r) => res.send(r)); });

app.post('/reset-tournament/:id', (req, res) => {
    const tId = req.params.id;
    const { target } = req.body; 
    if (target === 'all') {
        db.query('DELETE FROM goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
            db.query('DELETE FROM matches WHERE tournament_id = ? AND phase != "grupo"', [tId], () => {
                db.query('UPDATE matches SET played = 0, team_a_goals = 0, team_b_goals = 0, votings_end_at = NULL WHERE tournament_id = ?', [tId], () => res.send("OK"));
            });
        });
    } else {
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
    const matchId = req.params.id;
    const date = match_date ? match_date.replace('T', ' ').slice(0, 19) : null;

    let v_end = null;
    if (played == true || played == 1 || played == "true") {
        const ahora = new Date();
        const fechaFin = new Date(ahora.getTime() + 20 * 60000); // 20 min para votar
        v_end = fechaFin.toISOString().slice(0, 19).replace('T', ' ');
    }

    const sql = "UPDATE matches SET team_a_goals=?, team_b_goals=?, played=?, referee=?, match_date=?, votings_end_at=? WHERE id=?";
    const params = [team_a_goals, team_b_goals, played, referee, date, v_end, matchId];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("ERROR CRÍTICO:", err.message);
            return res.status(500).send(err.message);
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

app.get('/players/:tId', (req, res) => { 
    db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); 
});

app.get('/players/team/:teamId', (req, res) => {
    db.query('SELECT * FROM players WHERE team_id = ?', [req.params.teamId], (err, r) => res.send(r));
});

app.post('/players', (req, res) => { 
    db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], () => res.send("OK")); 
});

app.get('/goals/:tId', (req, res) => { db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tId], (err, r) => res.send(r || [])); });

app.get('/stats/:tId', (req, res) => {
    const tId = req.params.tId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => { db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] })); });
});

// --- SISTEMA DE VOTOS MVP ---
app.post('/submit-votes', (req, res) => {
    const { match_id, voter_id, votes } = req.body; 
    if (!match_id || !voter_id || !votes || votes.length < 5) return res.status(400).send("Votación incompleta");

    db.query('SELECT id FROM votes WHERE match_id = ? AND voter_id = ?', [match_id, voter_id], (err, results) => {
        if (results && results.length > 0) return res.status(400).send("Ya has votado en este partido");

        const values = votes.map(v => [match_id, voter_id, v.player_id, v.points]);
        db.query('INSERT INTO votes (match_id, voter_id, player_id, points) VALUES ?', [values], (err) => {
            if (err) return res.status(500).send(err);
            res.send("¡Votos registrados!");
        });
    });
});

app.get('/player-rating/:id', (req, res) => {
    const sql = `SELECT p.*, (60 + COALESCE(SUM(v.points), 0)) as current_rating FROM players p LEFT JOIN votes v ON p.id = v.player_id WHERE p.id = ? GROUP BY p.id`;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]);
    });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => {
    console.log("🚀 Server Running - v3.9.4");
});