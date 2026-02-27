import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Table, LogOut, Users, Send, Medal, Clock } from 'lucide-react'; 
import FutCard from './FutCard'; 

const API_URL = "https://gestionfutbol-production.up.railway.app";

const MainDashboard = ({ player, onLogout }) => {
  const navigate = useNavigate();
  const [tId, setTId] = useState(null);
  const [livePlayer, setLivePlayer] = useState(player);
  
  // --- 🕒 LÓGICA DEL TIEMPO REAL ---
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Limpieza al desmontar
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
  // ---------------------------------

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const resT = await axios.get(`${API_URL}/tournaments`);
        if (resT.data.length > 0) {
          const currentTid = resT.data[resT.data.length - 1].id;
          setTId(currentTid);
          const [resM, resG] = await Promise.all([
            axios.get(`${API_URL}/matches/${currentTid}`),
            axios.get(`${API_URL}/goals/${currentTid}`)
          ]);
          const goals = resG.data.filter(g => g.player_id === player?.id).length;
          const pMatches = resM.data.filter(m => (m.played) && (m.team_a_id === player?.team_id || m.team_b_id === player?.team_id));
          const wins = pMatches.filter(m => (m.team_a_id === player?.team_id ? m.team_a_goals > m.team_b_goals : m.team_b_goals > m.team_a_goals)).length;

          let rating = 65 + (pMatches.length * 4) + (goals * 4) + (wins * 3);
          rating = Math.min(Math.max(rating, 65), 99);

          setLivePlayer({
            ...player,
            rating: rating,
            team_name: player?.team_name || pMatches[0]?.team_a_name || pMatches[0]?.team_b_name || 'SIN EQUIPO',
            stats: {
              pac: Math.min(rating + 2, 99), 
              sho: Math.min(60 + (goals * 12), 99), 
              pas: Math.min(65 + (pMatches.length * 3), 99), 
              dri: Math.min(rating - 1, 99), 
              def: 55, 
              phy: 75 
            }
          });
        }
      } catch (e) { console.error(e); }
    };
    if (player?.id) fetchLiveStats();
  }, [player]);

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden relative"
         style={{
           backgroundColor: '#0a0a0a',
           backgroundImage: `
             linear-gradient(30deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f),
             linear-gradient(150deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f),
             linear-gradient(60deg, #141414 25%, transparent 25.5%, transparent 75%, #141414 75%, #141414)
           `,
           backgroundSize: '40px 70px'
         }}>
      
      {/* TEXTURA DE CARBONO */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}></div>

      {/* 1. HEADER CON TIEMPO REAL */}
      <div className="pt-8 pb-0 px-8 flex justify-between items-start z-30">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter text-orange-500 drop-shadow-[0_2px_10px_rgba(249,115,22,0.4)]">
            PRO LEAGUE
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={10} className="text-orange-400 animate-pulse" />
            <span className="text-[10px] font-black font-mono text-zinc-400 tracking-widest uppercase">
              {formattedDate} | {formattedTime}
            </span>
          </div>
        </div>
        
        <button onClick={onLogout} className="text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 active:scale-90">
          <LogOut size={18} />
        </button>
      </div>

      {/* 2. ÁREA DE LA CARTA */}
      <div className="flex flex-col items-center justify-start relative mt-2">
        <div className="absolute top-0 w-80 h-80 bg-orange-600/15 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative w-full h-[210px] flex items-center justify-center z-10">
            <div className="scale-[0.52] flex items-center justify-center drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                <FutCard player={livePlayer} view="dashboard" />
            </div>
        </div>

        <div className="text-center z-20 mt-1">
          <p className="text-[10px] text-orange-400 font-black uppercase tracking-[0.5em] opacity-80">
            {livePlayer?.team_name}
          </p>
        </div>
      </div>

      {/* 3. BOTONERA GRID 2x2 */}
      <div className="flex-1 bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-t-[45px] px-6 pt-6 pb-8 border-t border-white/10 shadow-[0_-30px_60px_rgba(0,0,0,1)] mt-2">
        <div className="grid grid-cols-2 gap-4 mb-4 h-[calc(100%-60px)] content-start">
            {[
              { label: 'Partidos', icon: <Calendar size={32} />, color: 'text-blue-400', action: () => navigate(`/tournament/${tId}`, { state: { tab: 'matches' } }) },
              { label: 'Tabla', icon: <Table size={32} />, color: 'text-emerald-400', action: () => navigate(`/tournament/${tId}`, { state: { tab: 'table' } }) },
              { label: 'Fichajes', icon: <Users size={32} />, color: 'text-purple-400', action: () => {} },
              { label: 'Votar', icon: <Send size={32} />, color: 'text-orange-400', action: () => navigate('/vote-mvp') }
            ].map((btn, idx) => (
              <button 
                key={idx}
                onClick={btn.action}
                className="bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-white/5 rounded-[30px] p-6 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
              >
                <div className={`${btn.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`}>{btn.icon}</div>
                <span className="text-[11px] text-zinc-200 font-black uppercase italic tracking-widest">{btn.label}</span>
              </button>
            ))}
        </div>

        <button className="w-full bg-gradient-to-r from-orange-600 to-orange-400 py-4 rounded-[25px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(154,52,18,0.4)] active:scale-[0.98] transition-all">
          <Medal size={22} className="text-white" />
          <span className="font-black italic uppercase text-sm tracking-tight text-white">Ranking Global MVP</span>
        </button>
      </div>
    </div>
  );
};

export default MainDashboard;