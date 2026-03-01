const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Tu pool de Railway
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ENDPOINT: Login de Administrador
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario en la DB
        const [users] = await db.execute('SELECT * FROM users WHERE email = ? AND role = "admin"', [email]);

        if (users.length === 0) {
            return res.status(401).json({ message: "Credenciales inválidas o no eres Admin" });
        }

        const user = users[0];

        // 2. Comparar contraseña (Bcrypt)
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        // 3. Generar Token JWT (Válido por 24h)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secretofutnex2026',
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login exitoso",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// ENDPOINT: Registro de nuevo Administrador
router.post('/admin-register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Encriptar contraseña (Nunca guardar en texto plano)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Insertar en la DB con rol 'admin'
        const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "admin")';
        const [result] = await db.execute(sql, [name, email, hashedPassword]);

        res.status(201).json({ 
            message: "Administrador creado con éxito",
            userId: result.insertId 
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: "Ese email ya está registrado" });
        }
        console.error(error);
        res.status(500).json({ message: "Error al crear el administrador" });
    }
});

module.exports = router;