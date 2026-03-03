import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlayerRegistration from './components/portal/PlayerRegistration';
import CompleteProfile from './components/portal/CompleteProfile';
import AdminLogin from './components/v2/auth/AdminLogin';
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2';
import LeagueAdminDashboard from './components/LeagueAdminDashboard';
import ProtectedRoute from './components/v2/auth/ProtectedRoute';
import PlayerHome from './components/portal/PlayerHome'; // <--- NUEVO IMPORT

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔓 RUTAS PÚBLICAS */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/join/:token" element={<PlayerRegistration />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/player-home" element={<PlayerHome />} /> {/* <--- NUEVA RUTA */}
        
        {/* 🔒 RUTAS PROTEGIDAS */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboardV2 /></ProtectedRoute>} />
        <Route path="/admin/league/:id" element={<ProtectedRoute><LeagueAdminDashboard /></ProtectedRoute>} />

        <Route path="/" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;