import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';
import Onboarding from './components/Onboarding';
import MainDashboard from './components/MainDashboard';
import VoteMvp from './components/VoteMvp';

function App() {
  // Inicialización desde localStorage (Clave: user y my_player)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [myPlayer, setMyPlayer] = useState(() => {
    const saved = localStorage.getItem('my_player');
    return saved ? JSON.parse(saved) : null;
  });

  const [isEditing, setIsEditing] = useState(false);

  // Manejo de Login: Guardamos tanto el usuario como la carta
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Si los datos del login ya traen la carta, la guardamos directamente
    const playerCard = userData.player || (userData.user && userData.user.player);
    
    if (playerCard) {
      setMyPlayer(playerCard);
      localStorage.setItem('my_player', JSON.stringify(playerCard));
    }
  };

  const handleOnboardingComplete = (playerData) => {
    setMyPlayer(playerData);
    setIsEditing(false);
    localStorage.setItem('my_player', JSON.stringify(playerData));
  };

  const logout = () => {
    localStorage.clear(); 
    setUser(null);
    setMyPlayer(null);
    setIsEditing(false);
    window.location.href = "/login";
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> : (
            user.role === 'admin' ? <Navigate to="/admin-panel" replace /> : <Navigate to="/home" replace />
          )
        } />

        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />

        <Route path="/home" element={
          !user ? <Navigate to="/login" replace /> : (
            (!myPlayer || isEditing) 
              ? <Onboarding onComplete={handleOnboardingComplete} editPlayer={myPlayer} /> 
              : <MainDashboard player={myPlayer} onEdit={() => setIsEditing(true)} onLogout={logout} />
          )
        } />

        <Route path="/admin-panel" element={
          user?.role === 'admin' ? <AdminPanel user={user} onLogout={logout} /> : <Navigate to="/" replace />
        } />
        
        <Route path="/tournament/:id" element={<TournamentView user={user} />} />
        
        <Route path="/vote-mvp" element={myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/login" replace />} />
        <Route path="/vote-player/:matchId" element={myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;