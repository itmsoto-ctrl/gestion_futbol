const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10, // Subimos a 10 para soportar los 6 equipos entrando a la vez
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

module.exports = pool;