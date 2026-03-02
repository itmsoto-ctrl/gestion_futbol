const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    // Railway inyecta estas variables automáticamente si los servicios están vinculados
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306, // Por defecto 3306 en red interna
    
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 20000, 
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    
    // Solo activamos SSL si no estamos en localhost
    ssl: process.env.MYSQLHOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

module.exports = pool;