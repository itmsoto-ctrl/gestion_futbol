const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

// CONFIGURACIÓN DE TU DB (Usa tus variables de entorno de Railway)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

async function migratePasswords() {
    const connection = await mysql.createConnection(dbConfig);
    console.log("🚀 Conectado a la DB. Iniciando migración...");

    try {
        // 1. Traemos todos los usuarios
        const [users] = await connection.execute('SELECT id, password FROM users');
        const saltRounds = 10;

        for (let user of users) {
            // 💡 TRUCO: Los hashes de bcrypt suelen empezar por '$2b$' y tienen 60 caracteres.
            // Si la contraseña es corta o no tiene ese formato, es texto plano.
            if (user.password && !user.password.startsWith('$2b$')) {
                console.log(`🔐 Hasheando password para el ID: ${user.id}...`);
                
                const hashedPassword = await bcrypt.hash(user.password, saltRounds);
                
                // 2. Actualizamos el registro con el nuevo hash
                await connection.execute(
                    'UPDATE users SET password = ? WHERE id = ?',
                    [hashedPassword, user.id]
                );
            } else {
                console.log(`✅ ID ${user.id} ya tiene un hash o está vacío. Saltando...`);
            }
        }

        console.log("✨ ¡Migración completada con éxito! Todos los passwords son seguros ahora.");
    } catch (error) {
        console.error("❌ Error en la migración:", error);
    } finally {
        await connection.end();
    }
}

migratePasswords();