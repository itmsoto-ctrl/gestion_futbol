// src/components/v2/auth/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig'; 

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); 
        
        // 🔄 Lógica de retorno: si hay token de invitación, vuelve al portal
        const inviteToken = searchParams.get('token');
        if (inviteToken) {
            navigate(`/join/${inviteToken}`);
        } else {
            navigate('/admin/dashboard');
        }
      } else {
        alert(data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      alert("Error: No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-sm text-center">
        <img src="/logo-shine.webp" alt="VORA" className="h-10 mx-auto mb-10" />
        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-white">
            Acceso <span className="text-lime-400">VORA ID</span>
        </h2>

        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Email / Usuario</label>
            <input 
              type="text" required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all text-white"
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Contraseña</label>
            <input 
              type="password" required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all text-white"
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>
          <button 
            type="submit" disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl text-xl uppercase italic active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;