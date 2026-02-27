import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FutCard from './FutCard';
// Añadimos Trash2 a la lista de importación
import { Trophy, ChevronLeft, Loader2, CheckCircle2, Trash2 } from 'lucide-react';

const API_URL = "https://gestionfutbol-production.up.railway.app";

const VoteMvp = ({ myPlayer }) => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [votes, setVotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTid, setActiveTid] = useState(null);

  const pointsSystem = [5, 4, 3, 2, 1];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 1. Buscamos el ID del torneo
        const resT = await axios.get(`${API_URL}/tournaments`);
        
        if (resT.data.length > 0) {
          const tId = resT.data[resT.data.length - 1].id;
          setActiveTid(tId);

          // 2. Descargamos partidos y goles
          const [resM, resG] = await Promise.all([
            axios.get(`${API_URL}/matches/${tId}`),
            axios.get(`${API_URL}/goals/${tId}`)
          ]);
          
          setAllMatches(resM.data || []);
          setAllGoals(resG.data || []);

          // 3. FILTRO INTELIGENTE (Aquí es donde va tu lógica del tiempo)
          const now = new Date();
          const finished = resM.data.filter(m => {
            const estaJugado = (m.played == 1 || m.played == true);
            
            // Si quieres activar el límite de tiempo, usa estas líneas:
            // const tiempoRestante = new Date(m.voting_ends_at) - now;
            // return estaJugado && tiempoRestante > 0;
            
            // De momento, para el torneo, mostramos todos los finalizados:
            return estaJugado; 
          }).sort((a, b) => b.id - a.id);
          
          setMatches(finished);
        }
      } catch (e) { 
        console.error("Error cargando datos de votación:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, []);

  // DISPARADOR AUTOMÁTICO: Cuando llega a 5 votos, envía solo.
  useEffect(() => {
    if (Object.keys(votes).length === 5 && !isSubmitting) {
      const timer = setTimeout(() => {
        autoConfirmVotes();
      }, 600); // Pequeño delay para que el usuario vea la última moneda marcarse
      return () => clearTimeout(timer);
    }
  }, [votes]);

  const calculateRating = (p) => {
    const goals = allGoals.filter(g => g.player_id === p.id).length;
    const pMatches = allMatches.filter(m => m.played == 1 && (m.team_a_id === p.team_id || m.team_b_id === p.team_id));
    const wins = pMatches.filter(m => (m.team_a_id === p.team_id ? m.team_a_goals > m.team_b_goals : m.team_b_goals > m.team_a_goals)).length;
    
    let rating = 65 + (pMatches.length * 4) + (goals * 4) + (wins * 3);
    rating = Math.min(Math.max(rating, 65), 99);

    return {
      ...p,
      name: p.name.toUpperCase(),
      rating: rating,
      stats: { 
        pac: Math.min(rating + 2, 99), 
        sho: Math.min(60 + (goals * 12), 99), 
        pas: Math.min(65 + (pMatches.length * 3), 99), 
        dri: Math.min(rating - 1, 99), 
        def: 55, 
        phy: 75 
      }
    };
  };

  const selectMatch = async (match) => {
    setSelectedMatch(match);
    setLoading(true);
    try {
        const resP = await axios.get(`${API_URL}/players/${match.tournament_id}`);
        const eligible = resP.data
          .filter(p => (p.team_id === match.team_a_id || p.team_id === match.team_b_id) && p.id !== myPlayer?.id)
          .map(p => calculateRating(p));
        setPlayers(eligible);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleVote = (playerId, pts) => {
    const newVotes = { ...votes };
    Object.keys(newVotes).forEach(id => { if (newVotes[id] === pts) delete newVotes[id]; });
    newVotes[playerId] = pts;
    setVotes(newVotes);
  };

  const autoConfirmVotes = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        match_id: parseInt(selectedMatch.id), // Forzamos número
        voter_id: parseInt(myPlayer.id),     // Forzamos número
        votes: Object.keys(votes).map(id => ({ 
          player_id: parseInt(id), 
          points: parseInt(votes[id]) 
        }))
      };

      // Llamada al backend
      const response = await axios.post(`${API_URL}/submit-votes`, payload);
      
      // Si todo va bien, esperamos 2 segundos viendo la pantalla de éxito
      setTimeout(() => navigate('/home'), 2000);
      
    } catch (e) {
      // Si el servidor devuelve un error, lo mostramos limpio (sin HTML)
      const errorMsg = e.response?.data || "Error de conexión con el servidor";
      alert(errorMsg);
      setIsSubmitting(false);
      setVotes({}); // Reseteamos los votos para que pueda volver a intentar
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-fut-gold font-black animate-pulse">SINCRONIZANDO ESTADIO...</div>;

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-hidden font-sans">
      
      {/* HEADER */}
      <div className="bg-zinc-900 pt-12 pb-4 px-6 flex items-center justify-between border-b border-fut-gold/20 shadow-xl">
        <button onClick={() => selectedMatch ? setSelectedMatch(null) : navigate('/home')} className="text-zinc-400">
          <ChevronLeft size={30}/>
        </button>
        <h1 className="text-xs font-black uppercase italic tracking-widest text-fut-gold">
            {selectedMatch ? 'Puntuación Cracks' : 'Elegir Partido'}
        </h1>
        <Trophy size={22} className="text-fut-gold" />
      </div>

      {/* BARRA DE MONEDAS (PROGRESO) */}
      {selectedMatch && (
        <div className="bg-zinc-900/90 p-4 flex flex-col items-center border-b border-zinc-800 shadow-lg">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">
              Reparte las 5 monedas para finalizar
           </p>
           <div className="flex gap-3">
              {pointsSystem.map(p => (
                <div 
                  key={p} 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                    Object.values(votes).includes(p) 
                    ? 'bg-zinc-800 text-zinc-600 scale-90 opacity-40' 
                    : 'bg-fut-gold text-black shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse'
                  }`}
                >
                  {p}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* PANTALLA DE ÉXITO (AUTO-ENVÍO) */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-fut-gold rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.6)] mb-8 animate-bounce">
                <CheckCircle2 size={64} className="text-black" />
            </div>
            <h2 className="text-fut-gold text-3xl font-black uppercase italic tracking-tighter text-center px-10">
                ¡Votación <br/> Guardada!
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mt-4 animate-pulse">
                Actualizando Clasificaciones
            </p>
        </div>
      )}

      {!selectedMatch ? (
        /* VISTA LISTA PARTIDOS */
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {matches.map(m => (
            <button key={m.id} onClick={() => selectMatch(m)} className="w-full bg-zinc-900 border-2 border-zinc-800 p-6 rounded-[40px] flex flex-col items-center gap-2 active:scale-95 transition-all shadow-xl">
               <span className="text-[10px] text-fut-gold font-black uppercase tracking-widest italic opacity-70">CAMPO {m.field} • FINALIZADO</span>
               <div className="flex items-center gap-4 text-base font-black uppercase italic text-white">
                  <span>{m.team_a_name}</span>
                  <span className="text-zinc-600 text-xs font-bold">VS</span>
                  <span>{m.team_b_name}</span>
               </div>
               <div className="mt-2 bg-zinc-800 px-5 py-1.5 rounded-full text-xs font-black text-white italic border border-zinc-700">
                  {m.team_a_goals} - {m.team_b_goals}
               </div>
            </button>
          ))}
          {matches.length === 0 && <p className="text-center text-zinc-600 py-20 font-black uppercase text-xs">No hay partidos para votar.</p>}
        </div>
      ) : (
        /* VISTA SLIDER JUGADORES */
        <div className="flex-1 flex flex-col justify-center bg-zinc-950">
            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar w-full h-[540px] items-center">
                {players.map(p => (
                    <div key={p.id} className="snap-center shrink-0 w-[94%] mx-[3%] h-[490px] bg-[#f4f1e6] border-2 border-white rounded-[65px] flex items-center p-2 relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                        
                        {/* CARTA GIGANTE */}
                        <div className="flex-1 flex justify-center scale-[0.88] origin-center -ml-16">
                            <FutCard player={p} view="voting" />
                        </div>

                        {/* BOTONES CÍRCULOS (BLANCO Y NEGRO) */}
                        <div className="w-20 flex flex-col items-center justify-center gap-3 pr-4 z-10">
                            {pointsSystem.map(pts => (
                                <button
                                    key={pts}
                                    onClick={() => handleVote(p.id, pts)}
                                    className={`w-12 h-12 rounded-full text-sm font-black transition-all flex items-center justify-center border-2 shadow-sm ${
                                      votes[p.id] === pts 
                                      ? 'bg-zinc-900 text-white border-zinc-900 scale-110 shadow-xl' 
                                      : 'bg-white text-zinc-800 border-zinc-200 active:bg-zinc-100'
                                    }`}
                                >{pts}</button>
                            ))}
                            {/* BOTÓN PAPELERA (CORREGIDO) */}
                            {votes[p.id] && (
                                <button 
                                  onClick={() => { const nv = {...votes}; delete nv[p.id]; setVotes(nv); }} 
                                  className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-red-500 shadow-md active:scale-90"
                                >
                                  <Trash2 size={20} />
                                </button>
                            )}
                        </div>

                        {/* INDICADOR VOTO (DORADO) */}
                        {votes[p.id] && (
                            <div className="absolute top-10 right-10 bg-fut-gold text-black w-14 h-14 rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-4 border-[#f4f1e6] animate-in zoom-in">
                                <span className="text-[8px] leading-none opacity-70">PUNTOS</span>
                                <span className="text-2xl leading-none">{votes[p.id]}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <p className="text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em] mb-4 animate-pulse italic">
                ← DESLIZA PARA REPARTIR MONEDAS →
            </p>
        </div>
      )}
    </div>
  );
};

export default VoteMvp;