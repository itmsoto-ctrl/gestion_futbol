require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
app.use(cors()); app.use(express.json());

// Pool optimizado para Railway (Punto 3 - Velocidad de Login)
const db = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

const formatDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

// --- PRIORIDAD GRAVE: LOGIN CON DIAGNÓSTICO (Punto 3) ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.time(`Login-${username}`); // Inicia cronómetro en consola Railway
    
    const sql = 'SELECT id, username, role, active FROM users WHERE username = ? AND password = ? AND active = 1 LIMIT 1';
    
    db.query(sql, [username, password], (err, result) => {
        console.timeEnd(`Login-${username}`); // Muestra el tiempo exacto en logs
        
        if (err) {
            console.error("Error en DB Login:", err);
            return res.status(500).send("Error");
        }
        
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.status(401).send("Error");
        }
    });
});

app.get('/tournaments', (req, res) => { 
    db.query('SELECT * FROM tournaments', (err, r) => res.send(r)); 
});

// --- RESET MAESTRO MODULAR ---
app.post('/reset-tournament/:id', (req, res) => {
    const tId = req.params.id;
    const { target } = req.body; 
    if (target === 'all') {
        db.query('DELETE FROM goals WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
            db.query('DELETE FROM votes WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [tId], () => {
                db.query('DELETE FROM matches WHERE tournament_id = ? AND phase != "grupo"', [tId], () => {
                    db.query('UPDATE matches SET played = 0, team_a_goals = 0, team_b_goals = 0, votings_end_at = NULL WHERE tournament_id = ?', [tId], () => res.send("OK"));
                });
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
    const date = match_date ? match_date.replace('T', ' ').slice(0, 19) : null;
    let v_end = null;
    if (played == 1) {
        v_end = formatDate(new Date(Date.now() + 20 * 60000)); 
    }
    const sql = "UPDATE matches SET team_a_goals=?, team_b_goals=?, played=?, referee=?, match_date=?, votings_end_at=? WHERE id=?";
    db.query(sql, [team_a_goals, team_b_goals, played, referee, date, v_end, req.params.id], (err) => res.send("OK"));
});

app.post('/activate-phase/:id', (req, res) => {
    const { phase, pairings } = req.body;
    db.query('SELECT MAX(match_date) as last FROM matches WHERE tournament_id = ?', [req.params.id], (err, r) => {
        let start = r[0].last ? new Date(new Date(r[0].last).getTime() + 30*60000) : new Date();
        const matchesArr = pairings.map((p, i) => [req.params.id, p.a, p.b, formatDate(new Date(start.getTime() + (i > 1 ? 1800000 : 0))), p.field, phase, 0, 0, 0]);
        const sql = 'INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase, team_a_goals, team_b_goals, played) VALUES ?';
        db.query(sql, [matchesArr], () => res.send("OK"));
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
        if (result?.affectedRows > 0) {
            db.query(`UPDATE matches SET ${team_side} = GREATEST(0, ${team_side} - 1) WHERE id = ?`, [match_id], () => res.send("OK"));
        } else res.status(404).send("Error");
    });
});

app.get('/teams/:tId', (req, res) => { db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); });

// --- PRIORIDAD GRAVE: JUGADORES CON NOMBRE DE EQUIPO (Punto 4) ---
app.get('/players/:tId', (req, res) => { 
    db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tId], (err, r) => res.send(r)); 
});

app.post('/players', (req, res) => { 
    db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], () => res.send("OK")); 
});

app.get('/goals/:tId', (req, res) => { 
    db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tId], (err, r) => res.send(r || [])); 
});

app.get('/stats/:tId', (req, res) => {
    const tId = req.params.tId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => { db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] })); });
});

app.post('/submit-votes', (req, res) => {
    const { match_id, voter_id, votes } = req.body; 
    if (!match_id || !voter_id || !votes || votes.length < 5) return res.status(400).send("Error");
    db.query('SELECT id FROM votes WHERE match_id = ? AND voter_id = ?', [match_id, voter_id], (err, results) => {
        if (results?.length > 0) return res.status(400).send("Ya has votado");
        const values = votes.map(v => [match_id, voter_id, v.player_id, v.points]);
        db.query('INSERT INTO votes (match_id, voter_id, player_id, points) VALUES ?', [values], (err) => res.send("OK"));
    });
});

// ACTUALIZACIÓN PUNTO 4: Rating con Nombre de Equipo
app.get('/player-rating/:id', (req, res) => {
    const sql = `SELECT p.*, t.name as team_name, (60 + COALESCE(SUM(v.points), 0)) as current_rating 
                 FROM players p 
                 JOIN teams t ON p.team_id = t.id 
                 LEFT JOIN votes v ON p.id = v.player_id 
                 WHERE p.id = ? GROUP BY p.id, t.name`;
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result[0]);
    });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("🚀 Server v3.9.8 ready"));