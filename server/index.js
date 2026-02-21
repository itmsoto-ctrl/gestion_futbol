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
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10
});

const formatDateToMySQL = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.replace('T', ' ').slice(0, 19);
};

// --- RUTAS ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password], (err, result) => {
        if (result && result.length > 0) res.send(result[0]); else res.status(401).send("Error");
    });
});

app.get('/tournaments', (req, res) => { db.query('SELECT * FROM tournaments', (err, result) => res.send(result)); });

app.post('/tournaments', (req, res) => {
    db.query('INSERT INTO tournaments (name, type, status) VALUES (?, ?, "registro")', [req.body.name, req.body.type], (err, result) => res.send({ id: result.insertId }));
});

app.get('/matches/:tournamentId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m LEFT JOIN teams t1 ON m.team_a_id = t1.id LEFT JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC, m.id ASC`;
    db.query(sql, [req.params.tournamentId], (err, result) => res.send(result));
});

app.put('/matches/:matchId', (req, res) => {
    const { team_a_id, team_b_id, match_date, field, referee, team_a_goals, team_b_goals, played } = req.body;
    const sql = "UPDATE matches SET team_a_id=?, team_b_id=?, match_date=?, field=?, referee=?, team_a_goals=?, team_b_goals=?, played=? WHERE id=?";
    db.query(sql, [team_a_id, team_b_id, match_date.replace('T', ' ').slice(0,19), field, referee, team_a_goals, team_b_goals, played, req.params.matchId], (err) => res.send("OK"));
});

app.post('/activate-phase/:id', (req, res) => {
    const tId = parseInt(req.params.id);
    const { phase, pairings } = req.body;
    db.query('SELECT MAX(match_date) as lastDate FROM matches WHERE tournament_id = ?', [tId], (err, result) => {
        let baseTime = result[0].lastDate ? new Date(result[0].lastDate) : new Date();
        baseTime.setMinutes(baseTime.getMinutes() + 30);
        const matchesArr = pairings.map((pair, index) => {
            let matchTime = new Date(baseTime);
            if (phase === 'cuartos') {
                if (index === 2) matchTime.setMinutes(matchTime.getMinutes() + 30);
                if (index === 3) matchTime.setMinutes(matchTime.getMinutes() + 60);
            }
            return [tId, pair.a, pair.b, formatDateToMySQL(matchTime.toISOString()), pair.field, phase];
        });
        db.query('INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?', [matchesArr], (errIns) => res.send("OK"));
    });
});

app.get('/teams/:tournamentId', (req, res) => { db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result)); });
app.post('/teams', (req, res) => { db.query('INSERT INTO teams (tournament_id, name, logo_url, group_num) VALUES (?, ?, ?, ?)', [req.body.tournament_id, req.body.name, req.body.logo_url, req.body.group_num], (err, result) => res.send(result)); });
app.get('/players/:tournamentId', (req, res) => { db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result)); });
app.post('/players', (req, res) => { db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], (err, result) => res.send(result)); });
app.get('/goals/:tournamentId', (req, res) => { db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result)); });

app.post('/add-player-goal', (req, res) => {
    db.query('INSERT INTO goals (match_id, player_id, team_id) VALUES (?, ?, ?)', [req.body.match_id, req.body.player_id, req.body.team_id], (err) => {
        db.query(`UPDATE matches SET ${req.body.team_side} = ${req.body.team_side} + 1, played = 1 WHERE id = ?`, [req.body.match_id], (err2) => res.send("OK"));
    });
});

app.post('/remove-player-goal', (req, res) => {
    db.query('DELETE FROM goals WHERE match_id = ? AND player_id = ? AND team_id = ? ORDER BY id DESC LIMIT 1', [req.body.match_id, req.body.player_id, req.body.team_id], (err, result) => {
        if (result.affectedRows > 0) {
            db.query(`UPDATE matches SET ${req.body.team_side} = CASE WHEN ${req.body.team_side} > 0 THEN ${req.body.team_side} - 1 ELSE 0 END WHERE id = ?`, [req.body.match_id], (err2) => res.send("OK"));
        } else res.status(404).send("Error");
    });
});

app.get('/stats/:tournamentId', (req, res) => {
    const tId = req.params.tournamentId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total_goals FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total_goals DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as goals_against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY goals_against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => {
        db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] }));
    });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log("🚀 Servidor v3.3"));