import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // IMPORTANTE: Cambia esta URL por la de tu servidor de Railway real
      const response = await fetch('${API_BASE_URL}/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token); 
        navigate('/admin/dashboard');
      } else {
        alert(data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      alert("Error: No se pudo conectar con el servidor de Railway");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl backdrop-blur-sm">
        <header className="text-center mb-10">
          <div className="inline-block bg-lime-400/10 p-3 rounded-2xl mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            Acceso <span className="text-lime-400">Admin</span>
          </h2>
          <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] mt-2">Introduce tus credenciales de gestor</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Email</label>
            <input 
              type="email" required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all placeholder:text-zinc-600"
              placeholder="admin@futnex.com"
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 ml-2 tracking-widest">Contraseña</label>
            <input 
              type="password" required
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-2xl py-4 px-6 focus:border-lime-400 outline-none transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl text-xl uppercase italic shadow-[0_10px_30px_rgba(163,230,53,0.2)] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>

        <footer className="mt-8 text-center">
          <button 
            onClick={() => navigate('/admin/setup')}
            className="text-zinc-500 text-[10px] uppercase font-bold hover:text-white transition-colors"
          >
            ¿No tienes cuenta? <span className="text-lime-400">Regístrate como Organizador</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminLogin;