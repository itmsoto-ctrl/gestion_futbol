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

const formatDateToMySQL = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.replace('T', ' ').slice(0, 19);
};

// --- RUTAS BÁSICAS ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password], (err, result) => {
        if (result && result.length > 0) res.send(result[0]); else res.status(401).send("Error");
    });
});
app.get('/tournaments', (req, res) => { db.query('SELECT * FROM tournaments', (err, result) => res.send(result)); });
app.get('/teams/:tournamentId', (req, res) => { db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result)); });
app.post('/teams', (req, res) => {
    db.query('INSERT INTO teams (tournament_id, name, logo_url, group_num) VALUES (?, ?, ?, ?)', [req.body.tournament_id, req.body.name, req.body.logo_url, req.body.group_num], (err, result) => res.send(result));
});
app.get('/players/:tournamentId', (req, res) => {
    db.query('SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result));
});
app.post('/players', (req, res) => {
    db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', [req.body.team_id, req.body.name, req.body.is_goalkeeper ? 1 : 0], (err, result) => res.send(result));
});

// GET MATCHES
app.get('/matches/:tournamentId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m LEFT JOIN teams t1 ON m.team_a_id = t1.id LEFT JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC`;
    db.query(sql, [req.params.tournamentId], (err, result) => res.send(result));
});

// GOLES INDIVIDUALES PARA CONTADORES
app.get('/goals/:tournamentId', (req, res) => {
    db.query('SELECT g.* FROM goals g JOIN matches m ON g.match_id = m.id WHERE m.tournament_id = ?', [req.params.tournamentId], (err, result) => res.send(result));
});

app.post('/add-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    db.query('INSERT INTO goals (match_id, player_id, team_id) VALUES (?, ?, ?)', [match_id, player_id, team_id], (err) => {
        db.query(`UPDATE matches SET ${team_side} = ${team_side} + 1, played = 1 WHERE id = ?`, [match_id], (err2) => res.send("OK"));
    });
});

app.post('/remove-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    db.query('DELETE FROM goals WHERE match_id = ? AND player_id = ? AND team_id = ? ORDER BY id DESC LIMIT 1', [match_id, player_id, team_id], (err, result) => {
        if (result.affectedRows > 0) {
            db.query(`UPDATE matches SET ${team_side} = CASE WHEN ${team_side} > 0 THEN ${team_side} - 1 ELSE 0 END WHERE id = ?`, [match_id], (err2) => res.send("OK"));
        } else res.status(404).send("Error");
    });
});

app.get('/stats/:tournamentId', (req, res) => {
    const tId = req.params.tournamentId;
    const sqlG = `SELECT p.name, t.name as team_name, COUNT(g.id) as total_goals 
                  FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id 
                  WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total_goals DESC LIMIT 10`;
    const sqlP = `SELECT p.name, t.name as team_name, 
                  (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id 
                   WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as goals_against 
                  FROM players p JOIN teams t ON p.team_id = t.id 
                  WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY goals_against ASC LIMIT 10`;
    db.query(sqlG, [tId], (err, g) => {
        db.query(sqlP, [tId], (err2, p) => res.send({ goleadores: g || [], porteros: p || [] }));
    });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () => console.log(`🚀 v3.0 Lista`));