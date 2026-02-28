import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';
import Onboarding from './components/Onboarding';
import MainDashboard from './components/MainDashboard';
import VoteMvp from './components/VoteMvp';

function App() {
  // Inicialización directa desde localStorage para evitar parpadeos
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [myPlayer, setMyPlayer] = useState(() => {
    const saved = localStorage.getItem('my_player');
    return saved ? JSON.parse(saved) : null;
  });

  const [isEditing, setIsEditing] = useState(false);

  // Manejo de Login y persistencia
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Guardado del jugador (Onboarding)
  const handleOnboardingComplete = (playerData) => {
    setMyPlayer(playerData);
    setIsEditing(false);
    localStorage.setItem('my_player', JSON.stringify(playerData));
  };

  // Logout limpio para tests
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('my_player');
    setUser(null);
    setMyPlayer(null);
    setIsEditing(false);
    // Usamos el navigate natural de las rutas o recarga limpia
    window.location.href = "/login";
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* RUTA RAIZ: Redirección inteligente */}
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> : (
            user.role === 'admin' ? <Navigate to="/admin-panel" replace /> : <Navigate to="/home" replace />
          )
        } />

        {/* LOGIN */}
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />

        {/* HOME: Si ya existe myPlayer, va directo al Dashboard */}
        <Route path="/home" element={
          !user ? <Navigate to="/login" replace /> : (
            (!myPlayer || isEditing) 
              ? <Onboarding onComplete={handleOnboardingComplete} editPlayer={myPlayer} /> 
              : <MainDashboard player={myPlayer} onEdit={() => setIsEditing(true)} onLogout={logout} />
          )
        } />

        {/* PANEL ADMIN */}
        <Route path="/admin-panel" element={
          user?.role === 'admin' ? <AdminPanel user={user} onLogout={logout} /> : <Navigate to="/" replace />
        } />
        
        {/* VISTA DE TORNEO (TABLA Y PARTIDOS) */}
        <Route path="/tournament/:id" element={<TournamentView user={user} />} />
        
        {/* RUTAS DE VOTACIÓN MVP */}
        <Route path="/vote-mvp" element={
          myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/login" replace />
        } />
        
        <Route path="/vote-player/:matchId" element={
          myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/login" replace />
        } />

        {/* CATCH ALL: Por si entran en una ruta rara, al login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;