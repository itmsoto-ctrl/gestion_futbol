import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, ArrowRight, Loader2 } from 'lucide-react';
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
        const { token, user } = res.data;
        
        // Guardamos los datos esenciales
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', user.email); // 👈 Crucial para el PlayerHome
        localStorage.setItem('userRole', user.role);

        // 1️⃣ LÓGICA DE INVITACIÓN (CAPITANES/REGISTROS)
        if (inviteToken) {
          if (destination === 'claim') {
            try {
              const portalRes = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${inviteToken}`);
              const { id: teamId, league_id: leagueId } = portalRes.data.team;

              await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                { teamId },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              navigate('/complete-profile', { state: { leagueId, teamId, inviteToken } });
              return;
            } catch (err) { console.error("Error en vínculo:", err); }
          }
          navigate(`/join/${inviteToken}`);
          return;
        }

        // 2️⃣ REDIRECCIÓN POR ROL (LOGIN NORMAL)
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/player-home');
        }
      }
    } catch (error) {
      alert("Credenciales incorrectas. El vestuario está cerrado para ti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center p-6 font-sans" 
         style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
      
      {/* Overlay oscuro para resaltar el formulario */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Cabecera Impactante */}
        <div className="text-center mb-8 space-y-2">
            <img src="/logo-shine.webp" alt="VORA" className="h-10 mx-auto drop-shadow-2xl" />
            <h1 className="text-4xl font-black uppercase italic text-white tracking-tighter">
                VORA <span className="text-lime-400">ID</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Acceso Vestuarios</p>
        </div>

        {/* Tarjeta Glassmorphism */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="email" placeholder="TU EMAIL" required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-white/20"
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="password" placeholder="CONTRASEÑA" required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-white/20"
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] uppercase italic text-lg shadow-[0_10px_30px_rgba(163,230,53,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all">
              {loading ? <Loader2 className="animate-spin" /> : (
                <>SALTAR AL CAMPO <ArrowRight size={20} /></>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;