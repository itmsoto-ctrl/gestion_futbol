import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// He añadido Send e isAdmin (simulado) para que no marque error
import { Calendar, Table, Trophy, LogOut, Users, Send } from 'lucide-react'; 
import FutCard from './FutCard';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const MainDashboard = ({ player, onEdit, onLogout }) => {
  const navigate = useNavigate();
  const [tId, setTId] = useState(1);
  const [livePlayer, setLivePlayer] = useState(player); 
  const isMvpVotingActive = true;
  const isAdmin = player?.role === 'admin'; // Definimos isAdmin

  const goTo = (path) => navigate(`/${path}`); // Definimos goTo

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
          const pMatches = resM.data.filter(m => (m.played == 1) && (m.team_a_id === player?.team_id || m.team_b_id === player?.team_id));
          const wins = pMatches.filter(m => (m.team_a_id === player?.team_id ? m.team_a_goals > m.team_b_goals : m.team_b_goals > m.team_a_goals)).length;

          let rating = 65 + (pMatches.length * 4) + (goals * 4) + (wins * 3);
          rating = Math.min(Math.max(rating, 65), 99);

          setLivePlayer({
            ...player,
            rating: rating,
            stats: {
              pac: Math.min(rating + 2, 99), sho: Math.min(60 + (goals * 12), 99),
              pas: Math.min(65 + (pMatches.length * 3), 99), dri: Math.min(rating - 1, 99),
              def: 55, phy: 75
            }
          });
        }
      } catch (e) { console.error(e); }
    };
    if (player && !player.isGuest) fetchLiveStats();
  }, [player]);

  const menuItems = [
    { id: 'calendar', label: 'Calendario', icon: <Calendar />, action: () => goTo('matches') },
    { id: 'standings', label: 'Posiciones', icon: <Table />, action: () => goTo('table') },
    { id: 'players', label: 'Jugadores', icon: <Users />, action: () => {} },
    { id: 'mvp_podium', label: 'PODIO MVP', icon: <Trophy />, action: () => navigate('/mvp-podium') },
    { id: 'mvp_vote', label: 'VOTACIÓN', icon: <Send />, action: () => navigate('/vote-mvp'), active: isMvpVotingActive },
    { id: 'logout', label: 'Salir', icon: <LogOut />, action: onLogout },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#f4f1e6]">
      {/* CABECERA */}
      <div className="pt-14 pb-4 flex flex-col items-center relative">
        <div className="h-[160px] flex items-center justify-center scale-[0.52]">
          <FutCard player={livePlayer} isGuest={player?.isGuest || isAdmin} view="dashboard" />
        </div>
        <h2 className="text-zinc-900 text-xl font-black uppercase italic mt-[-10px]">
            {isAdmin ? "ADMINISTRADOR" : (player?.isGuest ? "ESPECTADOR" : player?.name)}
        </h2>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 opacity-60">
            {livePlayer?.team_name}
        </p>
      </div>

      {/* GRID DE BOTONES NARANJA OSCURO */}
      <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 p-6 content-center">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            className="relative bg-orange-800 rounded-[28px] flex flex-col items-center justify-center gap-2 py-5 shadow-[0_15px_30px_rgba(154,52,18,0.3)] active:scale-90 transition-all overflow-hidden"
          >
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-white rounded-r-full shadow-[2px_0_10px_white]"></div>
            {item.active && (
              <span className="absolute top-4 right-5 flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-white shadow-sm"></span>
              </span>
            )}
            <div className="p-2 bg-white/10 rounded-xl">
              {React.cloneElement(item.icon, { size: 24, className: "text-white" })}
            </div>
            <span className="text-[12px] font-black text-white uppercase italic tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="pb-6 text-center opacity-30 tracking-[0.4em] text-[8px] font-black uppercase text-zinc-500">Fut Torneo 2026</div>
    </div>
  );
};

export default MainDashboard;
