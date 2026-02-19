import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminPanel from './AdminPanel';
import TournamentView from './TournamentView';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <AdminPanel user={user} onLogout={logout} /> : <Navigate to="/" />} />
        <Route path="/tournament/:id" element={user ? <TournamentView user={user} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;