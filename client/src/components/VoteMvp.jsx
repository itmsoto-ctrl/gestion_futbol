import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import VoteMatchCard from './VoteMatchCard';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const VoteMvp = ({ myPlayer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // SEGURIDAD: Extraemos el match con valores por defecto para evitar errores de undefined
  const { match = null } = location.state || {};

  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (match && match.id) {
          // MODO SELECCIÓN JUGADORES
          const tA = match.team_a_id || match.teamA_id;
          const tB = match.team_b_id || match.teamB_id;
          
          const [resA, resB] = await Promise.all([
            axios.get(`${API_URL}/players/team/${tA}`).catch(() => ({data: []})),
            axios.get(`${API_URL}/players/team/${tB}`).catch(() => ({data: []}))
          ]);
          
          const todos = [...resA.data, ...resB.data];
          if (todos.length === 0 && match.tournament_id) {
             const resBackup = await axios.get(`${API_URL}/players/${match.tournament_id}`);
             setPlayers(resBackup.data);
          } else {
             setPlayers(todos);
          }
        } else {
          // MODO LISTA DE PARTIDOS
          const resT = await axios.get(`${API_URL}/tournaments`);
          if (resT.data && resT.data.length > 0) {
            const tId = resT.data[resT.data.length - 1].id;
            const resM = await axios.get(`${API_URL}/matches/${tId}`);
            // Solo mostramos los terminados
            setMatches(resM.data.filter(m => m.played === 1 || m.played === true));
          }
        }
      } catch (error) {
        console.error("Error en carga:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [match]);

  const handleVote = async (playerId) => {
    try {
      await axios.post(`${API_URL}/submit-votes`, {
        match_id: match.id,
        voter_id: myPlayer?.id,
        votes: [{ player_id: playerId, points: 5 }]
      });
      setVoted(true);
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      alert("Error al registrar voto");
      navigate('/home');
    }
  };

  if (voted) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white text-center p-6">
      <CheckCircle2 size={60} className="text-orange-500 mb-4 animate-bounce" />
      <h2 className="text-2xl font-black uppercase italic tracking-tighter">VOTO REGISTRADO</h2>
    </div>
  );

  // VISTA: SELECCIÓN DE JUGADOR (Diseño Premium Recuperado)
  if (match) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="p-6 flex items-center gap-4 sticky top-0 bg-black/90 backdrop-blur-md z-50 border-b border-white/5">
        <button onClick={() => navigate('/vote-mvp')} className="p-3 bg-white/5 rounded-2xl border border-white/10"><ArrowLeft size={20}/></button>
        <div>
          <h1 className="text-sm font-black uppercase italic text-orange-500 leading-none">VOTAR MVP</h1>
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{match.team_a_name || 'Equipo A'} vs {match.team_b_name || 'Equipo B'}</p>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-3xl font-black italic uppercase leading-tight mb-8">ELIGE AL MEJOR<br/>DEL ENCUENTRO</h2>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent animate-spin rounded-full"></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pb-10">
            {players.length > 0 ? players.map(p => (
              <div key={p.id} onClick={() => handleVote(p.id)} className="bg-zinc-900/50 border border-white/10 p-5 rounded-[30px] flex items-center justify-between active:scale-[0.98] transition-all hover:bg-orange-500/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5"><Star size={20} className="text-orange-500" /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter">{p.name}</h3>
                    <p className="text-[9px] text-zinc-600 uppercase font-bold">{p.team_name || 'Jugador'}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-zinc-700" />
              </div>
            )) : <p className="text-center text-zinc-500 py-10 uppercase text-[10px] font-bold">No hay jugadores disponibles</p>}
          </div>
        )}
      </div>
    </div>
  );

  // VISTA: LISTA DE PARTIDOS
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="pt-10 pb-6 px-6 flex justify-between items-center sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-50 border-b border-white/5">
        <button onClick={() => navigate('/home')} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-zinc-400"><ArrowLeft size={20} /></button>
        <div className="text-center"><h1 className="text-lg font-black italic text-orange-500 uppercase leading-none tracking-tighter">Votación</h1></div>
        <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"><Trophy size={20} /></div>
      </div>
      <div className="flex-1 px-6 pt-8 pb-20 overflow-y-auto">
        <h2 className="text-3xl font-black text-white italic leading-none mb-8 uppercase tracking-tighter">PARTIDOS<br/>FINALIZADOS</h2>
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent animate-spin rounded-full"></div></div>
        ) : (
          matches.length > 0 ? (
            matches.map(m => <VoteMatchCard key={m.id} match={m} onVote={(d) => navigate(`/vote-player/${m.id}`, { state: { match: d } })} />)
          ) : (
            <div className="bg-zinc-900/20 border border-white/5 rounded-[40px] p-12 text-center text-zinc-700 uppercase text-[10px] font-bold tracking-widest leading-relaxed">No hay urnas de votación<br/>abiertas en este momento</div>
          )
        )}
      </div>
    </div>
  );
};

export default VoteMvp;