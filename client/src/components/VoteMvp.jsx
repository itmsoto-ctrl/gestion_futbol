import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';
import VoteMatchCard from './VoteMatchCard'; // El componente que creamos antes

const API_URL = "https://gestionfutbol-production.up.railway.app";

const VoteMVP = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. Lógica del Reloj en Tiempo Real para la cabecera
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Carga de partidos desde la API
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Obtenemos el torneo activo
        const resT = await axios.get(`${API_URL}/tournaments`);
        if (resT.data.length > 0) {
          const tId = resT.data[resT.data.length - 1].id;
          // Obtenemos los partidos del torneo
          const resM = await axios.get(`${API_URL}/matches/${tId}`);
          
          // Filtramos solo los partidos que tienen fecha programada
          // (La lógica de si se muestran o no por tiempo la hace el VoteMatchCard interno)
          setMatches(resM.data.filter(m => m.played || m.schedule));
        }
      } catch (error) {
        console.error("Error cargando partidos para votar:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleVote = (match) => {
    // Aquí rediriges a la pantalla donde eliges al jugador específico de ese partido
    navigate(`/vote-player/${match.id}`, { state: { match } });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden relative"
         style={{
           backgroundColor: '#0a0a0a',
           backgroundImage: `
             linear-gradient(30deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f),
             linear-gradient(150deg, #0f0f0f 12%, transparent 12.5%, transparent 87%, #0f0f0f 87.5%, #0f0f0f),
             linear-gradient(60deg, #141414 25%, transparent 25.5%, transparent 75%, #141414 75%, #141414)
           `,
           backgroundSize: '40px 70px'
         }}>
      
      {/* TEXTURA DE CARBONO SOBREPUESTA */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}></div>

      {/* CABECERA FIJA */}
      <div className="pt-10 pb-6 px-6 flex justify-between items-center z-30 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/5 rounded-2xl border border-white/10 text-zinc-400 active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-black italic tracking-tighter text-orange-500 uppercase">
            Votación MVP
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={10} className="text-orange-400 animate-pulse" />
            <span className="text-[9px] font-mono font-black text-zinc-500 tracking-widest">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500">
          <Trophy size={20} />
        </div>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <div className="flex-1 px-6 pt-6 pb-20 z-10 overflow-y-auto">
        
        <div className="mb-8">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-1">Partidos Disponibles</p>
          <h2 className="text-2xl font-black text-white italic leading-none">SELECCIONA<br/>EL ENCUENTRO</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Buscando partidos...</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/5 rounded-[30px] p-10 text-center">
            <Clock size={40} className="mx-auto text-zinc-700 mb-4 opacity-20" />
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
              No hay votaciones activas en este momento
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => (
              <VoteMatchCard 
                key={match.id} 
                match={match} 
                onVote={handleVote} 
              />
            ))}
          </div>
        )}
      </div>

      {/* PIE DE PÁGINA DECORATIVO */}
      <div className="p-6 text-center opacity-20 z-0">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-500">
          PRO LEAGUE SEASON 2026
        </span>
      </div>
    </div>
  );
};

export default VoteMVP;