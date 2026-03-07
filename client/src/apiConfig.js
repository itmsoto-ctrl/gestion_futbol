// src/apiConfig.js

const hostname = window.location.hostname;

// Detectamos si estamos en un entorno local (localhost o una IP de red Wi-Fi típica)
const isLocalNetwork = 
  hostname === 'localhost' || 
  hostname === '127.0.0.1' || 
  hostname.startsWith('192.168.') || 
  hostname.startsWith('10.') || 
  hostname.startsWith('172.');

// Si estamos en desarrollo (Mac o Móvil en Wi-Fi), extraemos la IP dinámicamente y le ponemos el puerto 3001.
// Si estamos en producción (ej. Netlify/Vercel), usamos la URL de Railway.
const API_BASE_URL = isLocalNetwork 
  ? `http://${hostname}:3001` 
  : 'https://gestionfutbol-production.up.railway.app';

export default API_BASE_URL;