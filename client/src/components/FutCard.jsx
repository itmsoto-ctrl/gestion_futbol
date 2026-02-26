import React from 'react';

const FutCard = ({ player, size = "large", view = "dashboard" }) => {
  
  // 1. DEFINE AQUÍ LAS POSICIONES (Cambia estos números y verás el efecto)
  const getPos = () => {
    if (view === 'voting') {
      return { nombre: "top-[260px]", stats: "top-[310px]" };
    }
    if (view === 'selection') {
      return { nombre: "top-[285px]", stats: "top-[345px]" };
    }
    // SI CAMBIAS ESTOS, CAMBIARÁ EL HOME (DASHBOARD)
    return { nombre: "top-[285px]", stats: "top-[335px]" }; 
  };

  const pos = getPos();

  const scales = {
    small: "scale-[0.4] -m-24",
    medium: "scale-[0.7] -m-10",
    large: "scale-100"
  };

  if (!player) return null;

  return (
    <div className={`relative inline-block left-[20px] ${scales[size]} transition-all duration-500`}>
      <img src="/fut-card-bg.png" alt="FUT Card" className="w-[350px] h-auto drop-shadow-2xl" />

      {/* RATING */}
      <div className="absolute top-[68px] left-[70px] text-zinc-800 text-5xl font-black italic tracking-tighter">
        {player.rating || 60}
      </div>

      {/* POSICIÓN */}
      <div className="absolute top-[120px] left-[60px] text-zinc-800 text-xl font-bold uppercase">
        {player.position || 'PO'}
      </div>

      {/* EQUIPO */}
      <div className="absolute top-[148px] left-[40px] w-[60px] text-left leading-none">
        <span className="text-zinc-700 text-[20px] font-black uppercase block">
          {player.team_name?.substring(0, 12)}
        </span>
      </div>

      {/* NOMBRE JUGADOR */}
      <div className={`absolute ${pos.nombre} left-0 w-full text-center px-4`}>
        <span className="text-zinc-900 text-2xl font-black uppercase tracking-tighter truncate block italic">
          {player.name}
        </span>
      </div>

      {/* STATS IZQUIERDA */}
      <div className={`absolute ${pos.stats} left-[58px] text-left leading-[65px]`}>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.pac || 60}</span></div>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.sho || 60}</span></div>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.pas || 60}</span></div>
      </div>

      {/* STATS DERECHA */}
      <div className={`absolute ${pos.stats} left-[182px] text-left leading-[55px]`}>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.dri || 60}</span></div>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.def || 60}</span></div>
        <div className="flex items-center"><span className="text-zinc-800 font-black text-xl">{player.stats?.phy || 60}</span></div>
      </div>

      {/* DORSAL */}
      <div className="absolute bottom-[48px] left-0 w-full text-center opacity-40">
        <span className="text-zinc-800 text-[10px] font-black uppercase tracking-[0.2em]">
          {player.dorsal ? `#${player.dorsal}` : 'FUT TORNEO'}
        </span>
      </div>
    </div>
  );
};

export default FutCard;