const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Tu pool de Railway
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth.middleware');

// ==========================================
// 1. AUTENTICACIÓN Y REGISTRO
// ==========================================

// Comprobar si un email ya está registrado
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const [rows] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        res.json({ exists: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISTRO BÁSICO (Para el Slide 2 del jugador)
router.post('/register-basic', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        // Importante: Hasheamos la password para que sea seguro
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.execute(
            'INSERT INTO users (email, password, name, role, active) VALUES (?, ?, ?, "user", 1)',
            [email, hashedPassword, name]
        );
        
        res.status(201).json({ 
            success: true, 
            message: "Usuario creado", 
            userId: result.insertId 
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email ya registrado" });
        res.status(500).json({ error: error.message });
    }
});

// LOGIN ADMIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
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
        res.status(500).json({ message: "Error en el servidor", error_detail: error.message });
    }
});

// REGISTRO ADMIN
router.post('/admin-register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: "Administrador creado", userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Email ya registrado" });
        res.status(500).json({ message: "Error en registro", details: error.message });
    }
});

// ==========================================
// 2. BUSCADOR DE SEDES
// ==========================================

router.get('/venues/search', async (req, res) => {
    const query = req.query.q;
    try {
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
// 3. ACTUALIZACIÓN DE PERFIL
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
        await db.execute(sql, [dni || null, photo_url || null, phone || null, age || null, userId]);
        res.json({ message: "Perfil actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;