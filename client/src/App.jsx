// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompleteProfile from './components/portal/CompleteProfile'; 
import JoinLeague from './components/portal/JoinLeague';
import AdminLogin from './components/v2/auth/AdminLogin'; 
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2';
import LeagueAdminDashboard from './components/LeagueAdminDashboard'; // 👈 IMPORTANTE
import ProtectedRoute from './components/v2/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* ACCESO PÚBLICO PORTAL */}
        <Route path="/join/:token" element={<JoinLeague />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />

        {/* ADMIN AUTH */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* DASHBOARDS PROTEGIDOS */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        
        {/* 🚀 ESTA ES LA RUTA QUE FALTABA PARA ENTRAR EN LAS LIGAS */}
        <Route path="/admin/league/:id" element={<ProtectedRoute><LeagueAdminDashboard /></ProtectedRoute>} />

        {/* REDIRECCIÓN POR DEFECTO */}
        <Route path="/" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;