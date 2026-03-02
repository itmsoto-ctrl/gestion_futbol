// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompleteProfile from './components/portal/CompleteProfile'; 
import JoinLeague from './components/portal/JoinLeague';
import AdminLogin from './components/v2/auth/AdminLogin'; // 👈 Asegúrate de que esta ruta sea correcta
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2';
import ProtectedRoute from './components/v2/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login unificado (importante para que el redirect funcione) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* El Portal de Efraín */}
        <Route path="/join/:token" element={<JoinLeague />} />

        {/* El Formulario del Selfie (La pantalla que se ponía negra) */}
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* Dashboard Protegido */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;