import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';
import Onboarding from './components/Onboarding';
import MainDashboard from './components/MainDashboard';
import VoteMvp from './components/VoteMvp';

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [myPlayer, setMyPlayer] = useState(() => JSON.parse(localStorage.getItem('my_player')));
  const [isEditing, setIsEditing] = useState(false);

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* RUTA RAIZ: Decide según rol */}
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

        <Route path="/admin-panel" element={user?.role === 'admin' ? <AdminPanel user={user} onLogout={logout} /> : <Navigate to="/" replace />} />
        <Route path="/tournament/:id" element={<TournamentView user={user} />} />
        <Route path="/vote-mvp" element={myPlayer ? <VoteMvp myPlayer={myPlayer} /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;