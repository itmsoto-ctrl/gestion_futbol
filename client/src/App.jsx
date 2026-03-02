import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompleteProfile from './component/portal/CompleteProfile';

// 1. IMPORTACIÓN CRÍTICA (Asegúrate de que esta línea exista)
import TeamPortal from './components/portal/TeamPortal';

// Otros componentes (ajusta las rutas según tu carpeta real)
import SaaSLanding from './components/v2/SaaSLanding'; 
import AdminSetup from './components/v2/auth/AdminSetup'; 
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2.jsx';
import LandingPage from './components/v2/LandingPage'; 
import AdminLogin from './components/v2/auth/AdminLogin';
import LeagueAdminDashboard from './components/LeagueAdminDashboard';
import ProtectedRoute from './components/v2/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* PÚBLICO */}
        <Route path="/" element={<SaaSLanding />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        
        {/* DASHBOARD ADMIN */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        <Route path="/admin/league/:id" element={<ProtectedRoute><LeagueAdminDashboard /></ProtectedRoute>} />

        {/* 🚀 EL PORTAL VORA (RUTA /join/:token) */}
        {/* Al estar definido arriba en el import, ya no dará error */}
        <Route path="/join/:token" element={<TeamPortal />} />

        {/* OTROS */}
        <Route path="/login" element={<AdminLogin />} /> 
        <Route path="/info/:leagueId" element={<LandingPage />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Routes>
    </Router>
  );
}

export default App;