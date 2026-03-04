const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Tu pool de Railway
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth.middleware');


// ==========================================
// 1. AUTENTICACIÓN Y REGISTRO
// ==========================================

// Comprobar si un email ya está registrado y devolver sus datos
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        // 🔥 EL CAMBIO CLAVE: SELECT * para traernos el DNI, teléfono, etc.
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            // Si existe, enviamos 'exists: true' y esparcimos TODOS los datos del usuario
            res.json({ exists: true, ...rows[0] });
        } else {
            // Si no existe, solo enviamos que no existe
            res.json({ exists: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// REGISTRO BÁSICO (Para el Slide 2 del jugador)
router.post('/register-basic', async (req, res) => {
    const { email, name, password } = req.body;
    try {
        // 1. Doble check manual antes de insertar
        const [exists] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        
        if (exists.length > 0) {
            // Mantenemos tu lógica: si ya existe, no damos error, seguimos el flujo
            return res.status(200).json({ 
                success: true, 
                userId: exists[0].id, 
                message: "Usuario ya existente" 
            });
        }

        // 🛡️ SEGURIDAD: Ciframos la contraseña
        // Generamos un 'salt' y el hash. El '10' es el estándar de seguridad.
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 2. Si no existe, insertamos (Usamos hashedPassword en lugar de password)
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

// LOGIN ADMIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Buscamos al usuario solo por email (quitamos el filtro de admin)
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const user = users[0];

        // 2. Comprobamos la contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // 3. Generamos el Token
        const secret = process.env.JWT_SECRET || 'frase-super-secreta-de-daniel-2026';
        const token = jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn: '24h' });

        // 4. Enviamos la respuesta (Añadimos 'role' para que el Front redirija bien)
        res.json({
            message: "Login exitoso",
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                role: user.role // 👈 Esto es vital para tu nuevo AdminLogin.jsx
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

// NUEVA RUTA: Guardar la foto del selfie
router.post('/update-photo', async (req, res) => {
    const { email, photo_url } = req.body;

    try {
        // Actualizamos la foto_url con el enlace de Cloudinary
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

// Ruta: GET /api/auth/user-profile
router.get('/user-profile', async (req, res) => {
    const { email } = req.query;
    try {
        const query = `
        SELECT 
        u.*, 
        l.name AS league_name, 
        t.name AS team_name, 
        t.logo_url AS team_logo 
    FROM users u
    LEFT JOIN league_teams t ON u.team_id = t.id
    LEFT JOIN leagues l ON t.league_id = l.id
    WHERE u.email = ?;
        `;
        const [rows] = await db.execute(query, [email]);

        if (rows.length === 0) return res.status(404).json({ message: "No existe" });

        // IMPORTANTE: Devolvemos rows[0] para que sea un objeto {name: 'A', ...}
        console.log("Datos enviados al cliente:", rows[0]); 
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/update-player-full', async (req, res) => {
    const { email, photo_url, name, position, country_code } = req.body;
    try {
        const sql = `
            UPDATE users 
            SET photo_url = ?, name = ?, position = ?, country_code = ? 
            WHERE email = ?
        `;
        await db.execute(sql, [photo_url, name, position, country_code, email]);
        res.json({ success: true, message: "Ficha actualizada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;