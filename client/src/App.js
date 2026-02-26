import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';
import Onboarding from './components/Onboarding';
import MainDashboard from './components/MainDashboard';
import VoteMvp from './components/VoteMvp';

function App() {
  // Inicialización limpia
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [myPlayer, setMyPlayer] = useState(() => JSON.parse(localStorage.getItem('my_player')));
  const [isEditing, setIsEditing] = useState(false);

  // Debug para ver qué está pasando (mira la consola del navegador)
  useEffect(() => {
    console.log("Estado Actual - User:", user);
    console.log("Estado Actual - Identidad FUT:", myPlayer);
  }, [user, myPlayer]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
    window.location.href = "/";
  };

  return (
    <Router>
      <Routes>
        {/* RUTA RAIZ: Si no hay 'user', al Login. Sin excepciones. */}
        <Route path="/" element={
          !user ? <Navigate to="/login" replace /> : (
            user.role === 'admin' ? <Navigate to="/admin-panel" replace /> : <Navigate to="/home" replace />
          )
        } />

        <Route path="/login" element={
          !user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />
        } />

        {/* HOME JUGADOR: Solo entra si hay 'user'. Si no hay 'myPlayer', salta Onboarding */}
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
        <Route path="/vote-mvp" element={myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;