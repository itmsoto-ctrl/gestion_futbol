const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Buscamos el token en la cabecera 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.status(403).json({ message: "No se proporcionó un token de acceso." });
    }

    try {
        // 'secret_key' debe ser la misma que usaste en el login/registro
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta_aqui');
        req.user = decoded; // Guardamos los datos del admin (id, email) en la request
        next(); // ¡Adelante!
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado." });
    }
};

module.exports = { verifyToken };