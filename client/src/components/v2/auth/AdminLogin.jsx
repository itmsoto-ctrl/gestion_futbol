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
        
        // 💾 Guardado de sesión
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.role);

        // 1️⃣ LÓGICA DE INVITACIÓN / CAPITANES
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

        // 2️⃣ REDIRECCIÓN SEGÚN ROL
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/player-home');
        }
      }
    } catch (error) {
      // 🚨 Este es el error que te sale ahora
      alert("Credenciales incorrectas. Revisa tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Cabecera: Logo GIGANTE y VORA */}
        <div className="text-center mb-12 space-y-4">
            <img 
                src="/logo-shine.webp" 
                alt="VORA" 
                className="h-32 mx-auto drop-shadow-[0_0_30px_rgba(163,230,53,0.2)]" 
            />
            <h1 className="text-6xl font-black uppercase italic text-white tracking-tighter leading-none">
                VORA
            </h1>
            <div className="w-16 h-1 bg-lime-400 mx-auto rounded-full mt-2" />
        </div>

        {/* Formulario Estilo Premium */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="email" placeholder="TU EMAIL" required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-zinc-700"
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="password" placeholder="CONTRASEÑA" required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-zinc-700"
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
            <button className="text-[10px] font-black text-white/20 uppercase tracking-widest hover:text-lime-400 transition-colors">
              ¿Problemas con tu acceso?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;