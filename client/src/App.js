import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';
import Onboarding from './components/Onboarding';
import MainDashboard from './components/MainDashboard';
import VoteMvp from './components/VoteMvp';

function App() {
  // 1. Cargamos el usuario
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  
  // 2. Cargamos el player usando una clave ÚNICA para cada usuario
  const [myPlayer, setMyPlayer] = useState(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (savedUser) {
      const savedPlayer = localStorage.getItem(`player_${savedUser.id || savedUser.username}`);
      return savedPlayer ? JSON.parse(savedPlayer) : null;
    }
    return null;
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Al loguear, intentamos ver si este usuario ya tenía una carta guardada en este móvil
    const savedPlayer = localStorage.getItem(`player_${userData.id || userData.username}`);
    if (savedPlayer) {
      setMyPlayer(JSON.parse(savedPlayer));
    } else {
      setMyPlayer(null);
    }
  };

  const handleOnboardingComplete = (playerData) => {
    setMyPlayer(playerData);
    setIsEditing(false);
    // GUARDADO CLAVE: Guardamos la carta vinculada al ID del usuario
    if (user) {
      localStorage.setItem(`player_${user.id || user.username}`, JSON.stringify(playerData));
      // También guardamos una copia general por si acaso
      localStorage.setItem('my_player', JSON.stringify(playerData));
    }
  };

  const logout = () => {
    // No usamos clear() para no borrar las cartas guardadas de otros usuarios en el mismo móvil
    localStorage.removeItem('user');
    localStorage.removeItem('my_player');
    setUser(null);
    setMyPlayer(null);
    setIsEditing(false);
    window.location.href = "/login";
  };

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={!user ? <Navigate to="/login" replace /> : (user.role === 'admin' ? <Navigate to="/admin-panel" replace /> : <Navigate to="/home" replace />)} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
        <Route path="/home" element={
          !user ? <Navigate to="/login" replace /> : (
            (!myPlayer || isEditing) 
              ? <Onboarding onComplete={handleOnboardingComplete} editPlayer={myPlayer} /> 
              : <MainDashboard player={myPlayer} onEdit={() => setIsEditing(true)} onLogout={logout} />
          )
        } />
        <Route path="/admin-panel" element={user?.role === 'admin' ? <AdminPanel user={user} onLogout={logout} /> : <Navigate to="/" replace />} />
        <Route path="/tournament/:id" element={<TournamentView user={user} />} />
        <Route path="/vote-mvp" element={myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;