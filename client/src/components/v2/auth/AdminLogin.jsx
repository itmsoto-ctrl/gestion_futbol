import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../../apiConfig'; 

const AdminLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });

  const inviteToken = searchParams.get('token');
  const destination = searchParams.get('dest');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });

      if (res.data.token) {
        const token = res.data.token;
        localStorage.setItem('token', token);

        // 🚀 LÓGICA DE RETORNO PARA EFRAÍN
        if (inviteToken) {
          // 1. Si es capitán, lo vinculamos en la DB antes de seguir
          if (destination === 'claim') {
            try {
              // Primero obtenemos el ID del equipo con el token
              const portalRes = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${inviteToken}`);
              const teamId = portalRes.data.team.id;
              const leagueId = portalRes.data.team.league_id;

              await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                { teamId },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              // 2. Lo mandamos al selfie con los datos necesarios
              navigate('/complete-profile', { 
                state: { leagueId, teamId, inviteToken } 
              });
              return;
            } catch (err) {
              console.error("Error en vínculo:", err);
            }
          }
          // Si es invitación normal, al portal de nuevo
          navigate(`/join/${inviteToken}`);
        } else {
          // Si es login normal del administrador
          navigate('/admin/dashboard');
        }
      }
    } catch (error) {
      alert("Error al entrar. Revisa tus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
        <img src="/logo-shine.webp" alt="VORA" className="h-10 mx-auto mb-10" />
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="email" placeholder="EMAIL" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-lime-400"
            onChange={(e) => setCredentials({...credentials, email: e.target.value})}
          />
          <input 
            type="password" placeholder="CONTRASEÑA" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-lime-400"
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-2xl uppercase italic">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;