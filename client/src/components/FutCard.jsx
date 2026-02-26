import React from 'react';

const FutCard = ({ player, size = "large", view = "dashboard" }) => {
  if (!player) return null;

  // Lógica de rareza según puntuación
  const getCardImage = (rating) => {
    if (rating >= 92) return '/leyenda.png';
    if (rating >= 75) return '/oro.png';
    if (rating >= 65) return '/plata.png';
    return '/bronce.png';
  };

  const getPos = () => {
    if (view === 'voting') return { nombre: "top-[260px]", stats: "top-[298px]" };
    if (view === 'selection') return { nombre: "top-[285px]", stats: "top-[345px]" };
    return { nombre: "top-[265px]", stats: "top-[345px]" };
  };

  const pos = getPos();
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  const StatLine = ({ label, value }) => (
    <div className="flex items-center gap-1">
      <span className="text-zinc-800 font-black text-xl w-7">{value || 60}</span>
      <span className="text-zinc-700 font-bold text-[10px] uppercase opacity-70">{label}</span>
    </div>
  );

  return (
    <div className={`relative inline-block left-[20px] ${scales[size]} transition-all duration-500`}>
      <img src={getCardImage(player.rating)} alt="Card" className="w-[350px] h-auto drop-shadow-2xl" />

      {/* RATING */}
      <div className="absolute top-[68px] left-[70px] text-zinc-800 text-5xl font-black italic tracking-tighter">
        {player.rating || 60}
      </div>

      {/* POSICIÓN */}
      <div className="absolute top-[120px] left-[80px] text-zinc-800 text-xl font-bold uppercase">
        {player.position || 'PO'}
      </div>

      {/* NOMBRE JUGADOR */}
      <div className={`absolute ${pos.nombre} left-0 w-full text-center px-4`}>
        <span className="text-zinc-900 text-2xl font-black uppercase tracking-tighter truncate block italic">{player.name}</span>
      </div>

      {/* STATS IZQUIERDA */}
      <div className={`absolute ${pos.stats} left-[58px] text-left leading-[65px]`}>
        <StatLine label="RIT" value={player.stats?.pac} />
        <StatLine label="TIR" value={player.stats?.sho} />
        <StatLine label="PAS" value={player.stats?.pas} />
      </div>

      {/* STATS DERECHA */}
      <div className={`absolute ${pos.stats} left-[182px] text-left leading-[55px]`}>
        <StatLine label="REG" value={player.stats?.dri} />
        <StatLine label="DEF" value={player.stats?.def} />
        <StatLine label="FIS" value={player.stats?.phy} />
      </div>
    </div>
  );
};

export default FutCard;