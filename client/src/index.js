import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; 
import App from './App';

// 1. IMPORTAMOS EL REGISTRADOR (El archivo que tienes en /src)
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 2. 🔥 ACTIVAMOS LA MAGIA
// Esto registra el /serviceWorker.js que tienes en la carpeta /public
serviceWorkerRegistration.register();