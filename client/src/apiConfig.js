// src/apiConfig.js

// Esta constante detecta automáticamente si estás en desarrollo o en producción
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : 'https://gestionfutbol-production.up.railway.app';

export default API_BASE_URL;