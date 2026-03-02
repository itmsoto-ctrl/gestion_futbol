// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompleteProfile from './components/portal/CompleteProfile'; 
import JoinLeague from './components/portal/JoinLeague';
import AdminLogin from './components/v2/auth/AdminLogin'; 
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2';
import ProtectedRoute from './components/v2/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Portal de entrada para Efraín */}
        <Route path="/join/:token" element={<JoinLeague />} />

        {/* Login unificado */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Formulario de Selfie y Ficha */}
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* Dashboard Protegido */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        
        {/* Ruta por defecto opcional */}
        <Route path="/" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;