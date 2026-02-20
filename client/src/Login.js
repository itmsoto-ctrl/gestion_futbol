import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('https://gestionfutbol-production.up.railway.app/login', form);
      onLogin(res.data);
    } catch (error) {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Control de Campeonatos</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Usuario" style={{ width: '100%', marginBottom: '10px' }} 
               onChange={e => setForm({...form, username: e.target.value})} />
        <input type="password" placeholder="Contraseña" style={{ width: '100%', marginBottom: '10px' }} 
               onChange={e => setForm({...form, password: e.target.value})} />
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>
          Entrar
        </button>
      </form>
    </div>
  );
};

export default Login;