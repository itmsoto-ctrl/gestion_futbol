const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Tu conexión de Railway
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
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            res.json({ exists: true, ...rows[0] });
        } else {
            res.json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISTRO BÁSICO
router.post('/register-basic', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (exists.length > 0) {
            return res.status(200).json({ 
                success: true, 
                userId: exists[0].id, 
                message: "Usuario ya existente" 
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await db.execute(
            'INSERT INTO users (email, password, name, role, active) VALUES (?, ?, ?, "user", 1)',
            [email, hashedPassword, name]
        );

        res.status(201).json({ success: true, userId: result.insertId });
    } catch (error) {
        console.error("🚨 Error en registro:", error.message);
        res.status(500).json({ error: "Error en el servidor de registro" });
    }
});

// LOGIN (Usuarios y Admin)
router.post('/login', async (req, res) => {
    const { email, password, is_pwa } = req.body; // 👈 Recibimos el chivato de la PWA
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const user = users[0];

        // Comprobamos la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // 📱 ACTUALIZACIÓN SILENCIOSA DE PWA (El sitio correcto)
        if (is_pwa === 1) {
            await db.execute(
                'UPDATE users SET is_pwa = 1 WHERE id = ? AND (is_pwa = 0 OR is_pwa IS NULL)', 
                [user.id]
            );
        }

        // Generamos el Token
        const secret = process.env.JWT_SECRET || 'frase-super-secreta-de-daniel-2026';
        const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '24h' });

        res.json({
            message: "Login exitoso",
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role: user.role 
            }
        });
    } catch (error) {
        console.error("Error en login:", error);
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

// Guardar la foto del selfie
router.post('/update-photo', async (req, res) => {
    const { email, photo_url } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE users SET photo_url = ? WHERE email = ?',
            [photo_url, email]
        );
        res.json({ success: true, message: "URL guardada con éxito" });
    } catch (error) {
        console.error("Error SQL:", error);
        res.status(500).json({ success: false, message: "Error en base de datos" });
    }
});

// Marcar tutorial como visto
router.post('/complete-tutorial', async (req, res) => {
    const { email } = req.body;
    try {
        await db.execute(
            'UPDATE users SET tutorial_seen = 1 WHERE email = ?',
            [email]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta: GET /api/auth/user-profile
router.get('/user-profile', async (req, res) => {
    const { email } = req.query;
    try {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        const userBase = users[0];

        const queryTeams = `
            SELECT 
                lp.team_id, 
                t.name AS team_name, 
                t.logo AS team_logo, 
                l.name AS league_name
            FROM league_players lp
            JOIN league_teams t ON lp.team_id = t.id
            JOIN leagues l ON t.league_id = l.id
            WHERE lp.user_id = ?
        `;
        const [teams] = await db.execute(queryTeams, [userBase.id]);

        const activeTeam = teams.length > 0 ? teams[0] : {};

        const responseData = {
            ...userBase,           
            ...activeTeam,         
            all_teams: teams       
        };

        res.json(responseData);

    } catch (error) {
        console.error("🚨 Error en user-profile:", error);
        res.status(500).json({ error: error.message });
    }
});

// RUTA: POST /api/auth/update-player-full
router.post('/update-player-full', async (req, res) => {
    const { email, photo_url, name, dni, position, country_code } = req.body;
    try {
        const sql = `
            UPDATE users 
            SET photo_url = ?, 
                name = ?, 
                dni = ?, 
                position = ?, 
                country_code = ? 
            WHERE email = ?
        `;
        
        await db.execute(sql, [
            photo_url || null, 
            name || null, 
            dni || null, 
            position || 'DEL', 
            country_code || 'es', 
            email
        ]);

        res.json({ success: true, message: "Ficha actualizada correctamente" });
    } catch (error) {
        console.error("🚨 Error crítico en update-player-full:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;