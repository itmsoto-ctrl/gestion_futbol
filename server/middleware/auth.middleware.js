const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log("🚨 Middleware: No se recibió token");
        return res.status(403).json({ message: "No se proporcionó un token de acceso." });
    }

    // 💡 IMPORTANTE: En producción NUNCA uses un fallback como 'tu_clave_secreta_aqui'
    // Si la variable no existe, el servidor debe fallar para que sepas que algo va mal.
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        console.error("🚨 ERROR CRÍTICO: JWT_SECRET no está definido en las variables de entorno");
        return res.status(500).json({ message: "Error de configuración en el servidor" });
    }

    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (error) {
        // Esto nos dirá en Railway si es 'invalid signature', 'jwt expired', etc.
        console.error("🚨 Error al verificar token:", error.message);
        return res.status(401).json({ message: "Token inválido o expirado." });
    }
};

module.exports = { verifyToken };