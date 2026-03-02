const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.MYSQLHOST || "shuttle.proxy.rlwy.net",
    user: process.env.MYSQLUSER || "root",
    password: process.env.MYSQLPASSWORD || "WmQUPzYMGioBxMsuEqkcYJapMYYjaTqy",
    database: process.env.MYSQLDATABASE || "railway",
    port: 24076,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 20000, 
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;