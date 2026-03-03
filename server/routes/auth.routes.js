const express = require('express');
const router = express.Router();
const db = require('../config/db'); // 👈 Tu pool de Railway (lo llamamos 'db')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth.middleware');

// ==========================================
// 1. AUTENTICACIÓN (ADMIN)
// ==========================================

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!db) return res.status(500).json({ message: "Error de configuración de DB" });

        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Credenciales inválidas o no eres Admin" });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Contraseña incorrecta" });

        const secret = process.env.JWT_SECRET || 'secretofutnex2026';
        const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '24h' });

        res.json({
            message: "Login exitoso",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("❌ ERROR CRÍTICO LOGIN:", error.message);
        res.status(500).json({ message: "Error en el servidor", error_detail: error.message });
    }
});

router.post('/admin-register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")';
        const [result] = await db.execute(sql, [name, email, hashedPassword]);

        res.status(201).json({ message: "Administrador creado", userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email ya registrado" });
        res.status(500).json({ message: "Error en registro", details: error.message });
    }
});

// ==========================================
// 2. SEDES (Buscador)
// ==========================================

router.get('/venues/search', async (req, res) => {
    const query = req.query.q;
    try {
        // ✅ Corregido: 'pool' cambiado por 'db'
        const [rows] = await db.execute(
            'SELECT * FROM venues WHERE name LIKE ? OR city LIKE ? OR address LIKE ? LIMIT 5',
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 3. PERFIL DE USUARIO / JUGADOR
// ==========================================

router.post('/update-profile', verifyToken, async (req, res) => {
    const { dni, photo_url, phone, age } = req.body;
    const userId = req.user.id;
    try {
        const sql = `
            UPDATE users 
            SET dni = COALESCE(?, dni), 
                photo_url = COALESCE(?, photo_url), 
                phone = COALESCE(?, phone), 
                age = COALESCE(?, age) 
            WHERE id = ?`;
        // ✅ Corregido: 'pool' cambiado por 'db'
        await db.execute(sql, [dni || null, photo_url || null, phone || null, age || null, userId]);
        res.json({ message: "Perfil actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// 4. LÓGICA DE INSCRIPCIÓN (TOKEN WHATSAPP)
// ==========================================



router.post('/join-team-by-token', verifyToken, async (req, res) => {
    const { inviteToken, dorsal } = req.body;
    const userId = req.user.id;

    try {
        // ✅ Corregido: 'pool' cambiado por 'db'
        const [teams] = await db.execute(
            'SELECT id, league_id FROM league_teams WHERE team_token = ?',
            [inviteToken]
        );

        if (teams.length === 0) return res.status(404).json({ message: "Token no válido" });

        const { id: teamId, league_id: leagueId } = teams[0];

        const [existing] = await db.execute(
            'SELECT id FROM league_players WHERE team_id = ? AND user_id = ?',
            [teamId, userId]
        );

        if (existing.length > 0) return res.status(400).json({ message: "Ya estás inscrito" });

        await db.execute(
            'INSERT INTO league_players (team_id, user_id, league_id, dorsal) VALUES (?, ?, ?, ?)',
            [teamId, userId, leagueId, dorsal || null]
        );

        res.json({ message: "¡Inscripción completada!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Comprobar si un email ya está registrado
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            return res.json({ exists: true });
        }
        res.json({ exists: false });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;