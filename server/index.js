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

// GET MATCHES mejorado para traer TODO sin filtros raros
app.get('/matches/:tournamentId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m 
                 LEFT JOIN teams t1 ON m.team_a_id = t1.id 
                 LEFT JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC, m.id ASC`;
    db.query(sql, [req.params.tournamentId], (err, result) => res.send(result));
});

app.put('/matches/:matchId', (req, res) => {
    const { team_a_id, team_b_id, match_date, field, referee, team_a_goals, team_b_goals, played } = req.body;
    const sql = "UPDATE matches SET team_a_id=?, team_b_id=?, match_date=?, field=?, referee=?, team_a_goals=?, team_b_goals=?, played=? WHERE id=?";
    db.query(sql, [team_a_id, team_b_id, formatDateToMySQL(match_date), field, referee, team_a_goals || 0, team_b_goals || 0, played || 0, req.params.matchId], (err) => res.send("OK"));
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
        if (result && result.affectedRows > 0) {
            db.query(`UPDATE matches SET ${team_side} = CASE WHEN ${team_side} > 0 THEN ${team_side} - 1 ELSE 0 END WHERE id = ?`, [match_id], (err2) => res.send("OK"));
        } else res.status(404).send("Error");
    });
});

app.post('/generate-playoffs-custom/:id', (req, res) => {
    const { phase, pairings } = req.body;
    const matchesArr = pairings.map(pair => [parseInt(req.params.id), pair.a, pair.b, formatDateToMySQL(new Date().toISOString()), pair.field, phase]);
    db.query('INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?', [matchesArr], (err) => res.send("OK"));
});

app.get('/stats/:tournamentId', (req, res) => {
    const tId = req.params.tournamentId;
    const sqlG = "SELECT p.name, t.name as team_name, COUNT(g.id) as total_goals FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total_goals DESC LIMIT 10";
    db.query(sqlG, [tId], (err, g) => res.send({ goleadores: g || [], porteros: [] }));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Servidor listo ${PORT}`); });