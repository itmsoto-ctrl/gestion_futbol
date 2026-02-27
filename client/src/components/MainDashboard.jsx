import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Table, Trophy, LayoutPanelTop, LogOut, Users, Edit2, Send } from 'lucide-react';
import FutCard from './FutCard';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const MainDashboard = ({ player, onEdit, onLogout }) => {
  const navigate = useNavigate();
  const [tId, setTId] = useState(1);
  const [livePlayer, setLivePlayer] = useState(player);
  const isMvpVotingActive = true;

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const resT = await axios.get(`${API_URL}/tournaments`);
        if (resT.data.length > 0) {
          const tid = resT.data[resT.data.length - 1].id;
          setTId(tid);
          if (player && !player.isGuest) {
            const [resM, resG] = await Promise.all([
                axios.get(`${API_URL}/matches/${tid}`),
                axios.get(`${API_URL}/goals/${tid}`)
            ]);
            const goals = resG.data.filter(g => g.player_id === player.id).length;
            const mPlayed = resM.data.filter(m => m.played && (m.team_a_id === player.team_id || m.team_b_id === player.team_id)).length;
            const wins = resM.data.filter(m => m.played && (m.team_a_id === player.team_id ? m.team_a_goals > m.team_b_goals : m.team_b_goals > m.team_a_goals)).length;

            const rat = Math.min(65 + (mPlayed * 4) + (goals * 4) + (wins * 3), 99);
            setLivePlayer({...player, rating: rat, stats: {pac: rat, sho: 60+(goals*12), pas: 65+(mPlayed*3), dri: rat-1, def: 55, phy: 75}});
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchLiveStats();
  }, [player]);

  const menuItems = [
    { label: 'Calendario', icon: <Calendar />, action: () => navigate(`/tournament/${tId}`, {state: {tab: 'matches'}}) },
    { label: 'Posiciones', icon: <Table />, action: () => navigate(`/tournament/${tId}`, {state: {tab: 'table'}}) },
    { label: 'Jugadores', icon: <Users />, action: () => {} },
    { label: 'Votación MVP', icon: <Trophy />, action: () => navigate('/vote-mvp'), active: isMvpVotingActive },
    { label: '11 Ideal', icon: <LayoutPanelTop />, action: () => {} },
    { label: 'Salir', icon: <LogOut />, action: onLogout },
  ];

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#f4f1e6] font-sans">
      <div onClick={onEdit} className="pt-14 pb-4 flex flex-col items-center relative cursor-pointer active:scale-95">
        <div className="absolute top-16 right-10 bg-white/40 p-2 rounded-full text-zinc-500 shadow-inner"><Edit2 size={14} /></div>
        <div className="h-[160px] flex items-center justify-center scale-[0.52]">
          <FutCard player={livePlayer} view="dashboard" />
        </div>
        <div className="text-center mt-2 font-black uppercase italic tracking-tighter text-zinc-900 text-lg">{livePlayer?.name}</div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">{livePlayer?.team_name}</div>
      </div>

      <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-4 p-6 content-center">
        {menuItems.map((item, i) => (
          <button key={i} onClick={item.action} className="relative bg-orange-800 rounded-[28px] flex flex-col items-center justify-center gap-2 py-5 shadow-2xl active:scale-90 overflow-hidden">
            <div className="absolute left-0 top-6 bottom-6 w-1 bg-white rounded-r-full shadow-[2px_0_10px_white]"></div>
            {item.active && <span className="absolute top-3 right-4 flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></span><span className="relative h-2 w-2 rounded-full bg-white"></span></span>}
            <div className="p-2 bg-white/10 rounded-xl text-white">{React.cloneElement(item.icon, { size: 24 })}</div>
            <span className="text-[12px] font-black text-white uppercase italic tracking-wider">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
export default MainDashboard;