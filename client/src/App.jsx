import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SaaSLanding from './components/v2/SaaSLanding'; // La nueva landing de venta
import AdminSetup from './components/v2/auth/AdminSetup'; // Perfil admin
import AdminDashboardV2 from './components/v2/admin/AdminDashboardV2.jsx';
import LandingPage from './components/v2/LandingPage'; // La landing del logo que ya teníamos
import AdminLogin from './components/v2/auth/AdminLogin';
// ... otros imports
import ProtectedRoute from './components/v2/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SaaSLanding />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/setup" element={<AdminSetup />} />
        
        {/* RUTA PROTEGIDA: Solo entras si tienes token */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboardV2 />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/join/:leagueId" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;