require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE CONEXIÓN A MYSQL ---
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

// Chivato de conexión
db.getConnection((err, connection) => {
    if (err) console.error("❌ ERROR MYSQL:", err.message);
    else { console.log("✅ CONEXIÓN MYSQL EXITOSA"); connection.release(); }
});

const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// --- 1. LOGIN ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password], (err, result) => {
        if (result && result.length > 0) res.send(result[0]); else res.status(401).send("Error");
    });
});

// --- 2. TORNEOS ---
app.get('/tournaments', (req, res) => { db.query('SELECT * FROM tournaments', (err, r) => res.send(r)); });

// --- 3. RESET MAESTRO MODULAR ---
app.post('/reset-tournament/:id', (req, res) => {
    const tId = req.params.id;
    const { target } = req.body; 
    if (target === 'all') {
        db.query('DELETE FROM goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
            db.query('DELETE FROM matches WHERE tournament_id = ? AND phase != "grupo"', [tId], () => {
                db.query('UPDATE matches SET played = 0, team_a_goals = 0, team_b_goals = 0 WHERE tournament_id = ? AND phase = "grupo"', [tId], () => res.send("OK"));
            });
        });
    } else {
        db.query('DELETE FROM matches WHERE tournament_id = ? AND phase = ?', [tId, target], (err) => {
            if (err) return res.status(500).send(err);
            res.send("OK");
        });
    }
});

// --- 4. PARTIDOS Y GOLES ---
app.get('/matches/:tId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m LEFT JOIN teams t1 ON m.team_a_id = t1.id LEFT JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC, m.id ASC`;
    db.query(sql, [req.params.tId], (err, r) => res.send(r));
});

app.put('/matches/:id', (req, res) => {
    const { team_a_goals, team_b_goals, played, referee, match_date } = req.body;
    const date = match_date ? match_date.replace('T', ' ').slice(0, 19) : null;
    db.query('UPDATE matches SET team_a_goals=?, team_b_goals=?, played=?, referee=?, match_date=? WHERE id=?', 
    [team_a_goals, team_b_goals, played, referee, date, req.params.id], (err) => res.send("OK"));
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

// --- 5. ACTIVACIÓN DE FASES ---
app.post('/activate-phase/:id', (req, res) => {
    const tId = req.params.id;
    const { phase, pairings } = req.body;
    db.query('SELECT MAX(match_date) as last FROM matches WHERE tournament_id = ?', [tId], (err, r) => {
        let start = r[0].last ? new Date(new Date(r[0].last).getTime() + 30*60000) : new Date();
        const matchesArr = pairings.map((p, i) => {
            let mt = new Date(start);
            if (phase === 'cuartos') { if(i === 2 || i === 3) mt.setMinutes(mt.getMinutes() + 30); }
            return [tId, p.a, p.b, formatDate(mt), p.field, phase];
        });
        db.query('INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?', [matchesArr], (err) => {
            if (err) return res.status(500).send(err);
            res.send("OK");
        });
    });
});

// --- 6. EQUIPOS, JUGADORES Y STATS ---
app.get('/teams/:tId', (req, res) => { db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); });
app.post('/teams', (req, res) => { db.query('INSERT INTO teams (tournament_id, name, logo_url, group_num) VALUES (?, ?, ?, ?)', [req.body.tournament_id, req.body.name, req.body.logo_url, req.body.group_num], (err, result) => res.send(result)); });
app.get('/players/:tId', (req, res) => { db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); });
app.post('/players', (req, res) => { db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], () => res.send("OK")); });
app.get('/goals/:tId', (req, res) => { db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tId], (err, r) => res.send(r || [])); });
app.get('/stats/:tId', (req, res) => {
    const tId = req.params.tId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => { db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] })); });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("🚀 Servidor v3.7.2 ready"));