import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FutCard from './FutCard';
import { Trophy, ChevronLeft, Loader2 } from 'lucide-react';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const VoteMvp = ({ myPlayer }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const pointsSystem = [5, 4, 3, 2, 1];

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        const resT = await axios.get(`${API_URL}/tournaments`);
        if (resT.data.length > 0) {
          const tId = resT.data.sort((a, b) => b.id - a.id)[0].id;
          const resM = await axios.get(`${API_URL}/matches/${tId}`);
          setMatches(resM.data.filter(m => m.played == 1).sort((a, b) => b.id - a.id));
        }
      } catch (e) { console.error("Error cargando partidos:", e); }
      finally { setLoading(false); }
    };
    loadMatches();
  }, []);

  const selectMatch = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
      let playersData = [];
      let goalsData = [];

      const resP = await axios.get(`${API_URL}/players/${match.tournament_id}`);
      playersData = resP.data || [];

      const rutasGoles = [
        `${API_URL}/goals`,
        `${API_URL}/player-goals`,
        `${API_URL}/goals/${match.tournament_id}`,
        `${API_URL}/match-goals/${match.id}`
      ];

      for (const ruta of rutasGoles) {
        try {
          const resG = await axios.get(ruta);
          if (resG.data && Array.isArray(resG.data)) {
            goalsData = resG.data;
            console.log("✅ Goles encontrados en:", ruta);
            break;
          }
        } catch (err) {
          console.warn(`❌ No hay goles en: ${ruta}`);
        }
      }

      const detailed = playersData
        .filter(p => (String(p.team_id).trim() === String(match.team_a_id).trim() || String(p.team_id).trim() === String(match.team_b_id).trim()))
        .map(p => {
          const pId = String(p.id).trim();
          const pTeamId = String(p.team_id).trim();

          const misGoles = goalsData.filter(g => 
            String(g.player_id || g.playerId).trim() === pId
          ).length;

          const esLocal = pTeamId === String(match.team_a_id).trim();
          const sA = Number(match.team_a_score || match.team_a_goals || 0);
          const sB = Number(match.team_b_score || match.team_b_goals || 0);
          const gano = esLocal ? (sA > sB) : (sB > sA);

          let ratingFinal = 62 + (misGoles * 8) + (gano ? 5 : 0);
          ratingFinal = Math.min(ratingFinal, 99);

          return { 
            ...p, 
            rating: ratingFinal,
            pac: ratingFinal,
            sho: Math.max(60, 60 + (misGoles * 15)), 
            pas: Math.max(60, 62 + (gano ? 8 : 0)),
            dri: Math.max(60, ratingFinal - 1),
            def: Math.max(60, 60 + (gano ? 5 : 0)),
            phy: Math.max(60, 65 + (gano ? 5 : 0))
          };
        });

      setPlayers(detailed.sort((a, b) => b.rating - a.rating));
    } catch (e) { 
        console.error("Error fatal procesando partido:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleVote = (playerId, pts) => {
    const newVotes = { ...votes };
    Object.keys(newVotes).forEach(id => { if (newVotes[id] === pts) delete newVotes[id]; });
    newVotes[playerId] = pts;
    setVotes(newVotes);
  };

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-orange-500 font-black animate-pulse">
      <Loader2 className="animate-spin mb-4" size={40} />
      ESCANER DE RENDIMIENTO...
    </div>
  );

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      {/* HEADER */}
      <div className="bg-zinc-900 pt-12 pb-5 px-6 flex items-center justify-between border-b border-orange-500/20 shadow-2xl">
        <button onClick={() => selectedMatch ? setSelectedMatch(null) : navigate('/home')} className="text-zinc-400 active:scale-90 transition-transform">
          <ChevronLeft size={30}/>
        </button>
        <div className="text-center">
            <h1 className="text-[10px] font-black uppercase italic tracking-[0.3em] text-orange-500 leading-none">VOTACIÓN MVP</h1>
            <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1 tracking-widest leading-none">Reparte los puntos</p>
        </div>
        <Trophy size={24} className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
      </div>

      {!selectedMatch ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {matches.map(m => (
            <button key={m.id} onClick={() => selectMatch(m)} className="w-full bg-zinc-900/60 backdrop-blur-md border border-white/5 p-6 rounded-[35px] flex justify-between items-center shadow-xl active:scale-95 transition-all">
               <div className="text-left">
                  <div className="text-[9px] text-orange-500 font-black uppercase mb-1 tracking-widest leading-none">Resultado</div>
                  <div className="font-black uppercase italic text-sm text-zinc-200">
                    {m.team_a_name} <span className="text-white mx-1">{m.team_a_score}-{m.team_b_score}</span> {m.team_b_name}
                  </div>
               </div>
               <div className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 border border-white/5">
                  <Trophy size={16} />
               </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative">
            <div className="flex justify-center gap-2 py-6">
                {pointsSystem.map(p => (
                    <div key={p} className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${
                        Object.values(votes).includes(p) ? 'bg-zinc-800 text-zinc-600 scale-75 border border-white/10' : 'bg-orange-500 text-black border-2 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                    }`}>{p}</div>
                ))}
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full py-4">
                {players.map(p => (
                    <div key={p.id} className="snap-center shrink-0 w-[85%] mx-[7.5%] bg-zinc-900/80 backdrop-blur-xl rounded-[50px] p-6 flex items-center border border-white/10 shadow-2xl relative">
                        <div className="flex-1 flex justify-center scale-[0.88] -ml-12 drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]">
                          <FutCard player={{...p, rating: p.rating + (votes[p.id] || 0)}} view="voting" />
                        </div>
                        
                        {/* BOTONES ACTUALIZADOS: BLANCOS POR DEFECTO */}
                        <div className="w-16 flex flex-col gap-2 z-10">
                            {pointsSystem.map(pts => (
                                <button 
                                    key={pts} 
                                    onClick={() => handleVote(p.id, pts)} 
                                    className={`w-12 h-12 rounded-2xl text-sm font-black transition-all active:scale-90 border-2 ${
                                        votes[p.id] === pts 
                                        ? 'bg-orange-500 border-orange-400 text-black scale-110 shadow-lg' 
                                        : 'bg-white border-white text-zinc-900 shadow-md'
                                    }`}
                                >
                                    {pts}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-auto p-10">
               <p className="text-center text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] italic">Desliza para ver a todos los cracks</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default VoteMvp;