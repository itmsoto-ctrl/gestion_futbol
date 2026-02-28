import React, { useState, useEffect } from 'react';
import { Clock, Send, Timer } from 'lucide-react';

const VoteMatchCard = ({ match, onVote }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calcularTiempo = () => {
      // 1. Obtenemos la hora en que finalizó el partido según la tabla 'matches'
      if (!match.votings_end_at) {
        setIsVisible(false); // Si no hay fecha de fin, no mostramos la urna por seguridad
        return;
      }

      const finPartido = new Date(match.votings_end_at);
      
      // 2. LA REGLA: La votación cierra exactamente 20 minutos después del fin del partido
      const fechaCierreReal = new Date(finPartido.getTime() + (20 * 60 * 1000));
      
      const ahora = new Date();
      const diferenciaMs = fechaCierreReal - ahora;

      if (diferenciaMs <= 0) {
        setIsVisible(false); // HAN PASADO LOS 20 MINUTOS: La caja se destruye
      } else {
        // Formateamos los minutos y segundos para el móvil
        const mins = Math.floor((diferenciaMs / 1000) / 60);
        const secs = Math.floor((diferenciaMs / 1000) % 60);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    calcularTiempo();
    const interval = setInterval(calcularTiempo, 1000);
    return () => clearInterval(interval);
  }, [match]);

  // Si ya pasaron los 20 minutos de margen, no se renderiza nada
  if (!isVisible) return null;

  const renderLogo = (logoUrl, teamName) => {
    if (logoUrl) {
      return (
        <img 
          src={logoUrl} 
          alt={teamName} 
          className="w-14 h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
          onError={(e) => e.target.style.display = 'none'}
        />
      );
    }
    return (
      <div className="w-14 h-14 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
        <span className="text-xl font-black italic text-zinc-300">{teamName?.charAt(0)}</span>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[35px] p-6 mb-4 relative overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      
      {/* HEADER: Cronómetro Dinámico */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500/10 p-2 rounded-xl border border-orange-500/20">
            <Clock size={16} className="text-orange-500 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Cierre de urna</span>
            <span className="text-sm font-mono font-black text-orange-400 tracking-wider">
              {timeLeft}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-[9px] font-black text-emerald-500 uppercase italic">Activa</span>
        </div>
      </div>

      {/* ENFRENTAMIENTO */}
      <div className="flex justify-between items-center px-2 mb-2">
        <div className="flex flex-col items-center w-2/5 text-center gap-3">
          {renderLogo(match.team_a_logo, match.team_a_name)}
          <span className="text-[11px] font-black uppercase italic leading-tight text-white tracking-tighter">
            {match.team_a_name}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-zinc-800 font-black italic text-3xl tracking-tighter opacity-50">VS</span>
        </div>

        <div className="flex flex-col items-center w-2/5 text-center gap-3">
          {renderLogo(match.team_b_logo, match.team_b_name)}
          <span className="text-[11px] font-black uppercase italic leading-tight text-white tracking-tighter">
            {match.team_b_name}
          </span>
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN */}
      <button
        onClick={() => onVote(match)}
        className="w-full mt-6 bg-gradient-to-r from-orange-600 to-orange-500 py-4 rounded-[22px] flex items-center justify-center gap-3 shadow-xl active:scale-[0.96] transition-all border-t border-white/20"
      >
        <Send size={18} className="text-white drop-shadow-md" />
        <span className="text-xs font-black uppercase italic text-white tracking-wide">
          Elegir Jugador MVP
        </span>
      </button>

      {/* Decoración de fondo */}
      <Timer size={120} className="absolute -right-8 -bottom-8 text-white/[0.02] -rotate-12 pointer-events-none" />
    </div>
  );
};

export default VoteMatchCard;