require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE CONEXIÓN FLEXIBLE ---
const db = mysql.createPool({
    host: process.env.MYSQLHOST || process.env.MYSQL_HOST,
    user: process.env.MYSQLUSER || process.env.MYSQL_USER,
    password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE,
    port: process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chivato de conexión
db.getConnection((err, connection) => {
    if (err) console.error("❌ ERROR MYSQL:", err.message);
    else { console.log("✅ CONEXIÓN EXITOSA A LA BASE DE DATOS"); connection.release(); }
});

// Función auxiliar para fechas MySQL
const formatDateToMySQL = (dateObj) => {
    try {
        return dateObj.toISOString().slice(0, 19).replace('T', ' ');
    } catch (e) {
        return new Date().toISOString().slice(0, 19).replace('T', ' ');
    }
};

// --- 1. LOGIN ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ? AND active = 1';
    db.query(sql, [username, password], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result && result.length > 0) res.send(result[0]);
        else res.status(401).send("Usuario o clave incorrecta");
    });
});

// --- 2. TORNEOS ---
app.get('/tournaments', (req, res) => {
    db.query('SELECT * FROM tournaments', (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/tournaments', (req, res) => {
    const { name, type } = req.body;
    db.query('INSERT INTO tournaments (name, type, status) VALUES (?, ?, "registro")', [name, type], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ id: result.insertId, name, type });
    });
});

// --- 3. EQUIPOS ---
app.get('/teams/:tournamentId', (req, res) => {
    db.query('SELECT * FROM teams WHERE tournament_id = ?', [req.params.tournamentId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/teams', (req, res) => {
    const { tournament_id, name, logo_url, group_num } = req.body;
    db.query('INSERT INTO teams (tournament_id, name, logo_url, group_num) VALUES (?, ?, ?, ?)', 
    [tournament_id, name, logo_url, group_num || 1], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.delete('/teams/:id', (req, res) => {
    db.query('DELETE FROM teams WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("OK");
    });
});

// --- 4. JUGADORES ---
app.get('/players/:tournamentId', (req, res) => {
    const sql = "SELECT p.*, t.name as team_name FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ?";
    db.query(sql, [req.params.tournamentId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.post('/players', (req, res) => {
    const { team_id, name, is_goalkeeper } = req.body;
    db.query('INSERT INTO players (team_id, name, is_goalkeeper) VALUES (?, ?, ?)', 
    [team_id, name, is_goalkeeper ? 1 : 0], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

// --- 5. PARTIDOS ---
app.get('/matches/:tournamentId', (req, res) => {
    const sql = `SELECT m.*, t1.name as team_a_name, t1.logo_url as team_a_logo, t2.name as team_b_name, t2.logo_url as team_b_logo 
                 FROM matches m JOIN teams t1 ON m.team_a_id = t1.id JOIN teams t2 ON m.team_b_id = t2.id 
                 WHERE m.tournament_id = ? ORDER BY m.match_date ASC`;
    db.query(sql, [req.params.tournamentId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

app.put('/matches/:matchId', (req, res) => {
    const { team_a_id, team_b_id, match_date, field, referee, team_a_goals, team_b_goals, played } = req.body;
    const date = match_date ? match_date.replace('T', ' ').slice(0, 19) : null;
    const sql = "UPDATE matches SET team_a_id=?, team_b_id=?, match_date=?, field=?, referee=?, team_a_goals=?, team_b_goals=?, played=? WHERE id=?";
    db.query(sql, [team_a_id, team_b_id, date, field, referee, team_a_goals || 0, team_b_goals || 0, played || 0, req.params.matchId], (err) => {
        if (err) return res.status(500).send(err);
        res.send("OK");
    });
});

// --- 6. GOLES ---
app.post('/add-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    db.query('INSERT INTO goals (match_id, player_id, team_id) VALUES (?, ?, ?)', [match_id, player_id, team_id], (err) => {
        if (err) return res.status(500).send(err);
        const sqlUpdate = `UPDATE matches SET ${team_side} = ${team_side} + 1, played = 1 WHERE id = ?`;
        db.query(sqlUpdate, [match_id], (err2) => {
            if (err2) return res.status(500).send(err2);
            res.send("OK");
        });
    });
});

app.post('/remove-player-goal', (req, res) => {
    const { match_id, player_id, team_id, team_side } = req.body;
    const sqlDel = 'DELETE FROM goals WHERE match_id = ? AND player_id = ? AND team_id = ? ORDER BY id DESC LIMIT 1';
    db.query(sqlDel, [match_id, player_id, team_id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.affectedRows > 0) {
            const sqlUpd = `UPDATE matches SET ${team_side} = CASE WHEN ${team_side} > 0 THEN ${team_side} - 1 ELSE 0 END WHERE id = ?`;
            db.query(sqlUpd, [match_id], (err2) => res.send("OK"));
        } else res.status(404).send("No hay goles");
    });
});

// --- 7. GENERADORES ---

// Campeonato: 8 equipos, 2 grupos
app.post('/generate-schedule/:id', (req, res) => {
    const tId = parseInt(req.params.id); 
    const { startTime } = req.body;
    db.query('SELECT * FROM teams WHERE tournament_id = ?', [tId], (err, teams) => {
        if (err) return res.status(500).send(err.message);
        const g1 = teams.filter(t => t.group_num == 1);
        const g2 = teams.filter(t => t.group_num == 2);

        if (g1.length !== 4 || g2.length !== 4) {
            return res.status(400).send(`Faltan equipos en los grupos (G1:${g1.length}, G2:${g2.length}). Deben ser 4 y 4.`);
        }

        const p = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]]; 
        let m = []; 
        let start = new Date(startTime);
        if (isNaN(start.getTime())) start = new Date();

        for (let i = 0; i < 3; i++) {
            const time = formatDateToMySQL(new Date(start.getTime() + (i * 30 * 60000)));
            m.push([tId, g1[p[i*2][0]].id, g1[p[i*2][1]].id, time, 1, 'grupo']);
            m.push([tId, g1[p[i*2+1][0]].id, g1[p[i*2+1][1]].id, time, 2, 'grupo']);
        }
        for (let i = 0; i < 3; i++) {
            const time = formatDateToMySQL(new Date(start.getTime() + ((i + 3) * 30 * 60000)));
            m.push([tId, g2[p[i*2][0]].id, g2[p[i*2][1]].id, time, 1, 'grupo']);
            m.push([tId, g2[p[i*2+1][0]].id, g2[p[i*2+1][1]].id, time, 2, 'grupo']);
        }
        db.query("INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?", [m], (errIns) => {
            if (errIns) return res.status(500).send(errIns.message);
            res.send("OK");
        });
    });
});

// Liga: 6 equipos, todos contra todos Ida y Vuelta
app.post('/generate-league/:id', (req, res) => {
    const tId = parseInt(req.params.id);
    db.query('SELECT * FROM teams WHERE tournament_id = ?', [tId], (err, teams) => {
        if (err) return res.status(500).send(err.message);
        if (teams.length < 6) return res.status(400).send("Se necesitan 6 equipos");
        let m = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = 0; j < teams.length; j++) {
                if (i !== j) m.push([tId, teams[i].id, teams[j].id, null, 1, 'liga']);
            }
        }
        db.query("INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?", [m], (errIns) => {
            if (errIns) return res.status(500).send(errIns.message);
            res.send("OK");
        });
    });
});

app.post('/generate-playoffs-custom/:id', (req, res) => {
    const { phase, pairings } = req.body;
    const matchesArr = pairings.map(pair => [parseInt(req.params.id), pair.a, pair.b, formatDateToMySQL(new Date()), pair.field, phase]);
    db.query('INSERT INTO matches (tournament_id, team_a_id, team_b_id, match_date, field, phase) VALUES ?', [matchesArr], (err) => {
        if (err) return res.status(500).send(err.message);
        res.send("OK");
    });
});

// --- 8. ESTADÍSTICAS ---
app.get('/stats/:tournamentId', (req, res) => {
    const tId = req.params.tournamentId;
    const sqlG = "SELECT p.name, t.name as team_name, COUNT(g.id) as total_goals FROM goals g JOIN players p ON g.player_id = p.id JOIN teams t ON g.team_id = t.id WHERE t.tournament_id = ? GROUP BY p.id, p.name, t.name ORDER BY total_goals DESC LIMIT 10";
    const sqlP = "SELECT p.name, t.name as team_name, (SELECT COUNT(*) FROM goals g2 JOIN matches m ON g2.match_id = m.id WHERE (m.team_a_id = t.id OR m.team_b_id = t.id) AND g2.team_id != t.id) as goals_against FROM players p JOIN teams t ON p.team_id = t.id WHERE t.tournament_id = ? AND p.is_goalkeeper = 1 GROUP BY p.id, p.name, t.name ORDER BY goals_against ASC LIMIT 10";
    db.query(sqlG, [tId], (err, g) => {
        if (err) return res.status(500).send(err);
        db.query(sqlP, [tId], (err2, p) => {
            if (err2) return res.status(500).send(err2);
            res.send({ goleadores: g || [], porteros: p || [] });
        });
    });
});

// --- INICIO ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT}`);
});