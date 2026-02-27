import React from 'react';

const FutCard = ({ player, size = "large", view = "dashboard" }) => {
  if (!player) return null;

  const getCardImage = (rating) => {
    if (rating >= 92) return '/leyenda.png';
    if (rating >= 75) return '/oro.png';
    if (rating >= 65) return '/plata.png';
    return '/bronce.png';
  };

  const getPos = () => {
    if (view === 'voting') return { nombre: "top-[260px]", stats: "top-[298px]" };
    if (view === 'selection') return { nombre: "top-[295px]", stats: "top-[335px]" };
    return { nombre: "top-[275px]", stats: "top-[325px]" };
  };

  const pos = getPos();
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <div className={`relative inline-block left-[20px] ${scales[size]} transition-all duration-500`}>
      <img src={getCardImage(player.rating)} alt="Card" className="w-[350px] h-auto drop-shadow-2xl" />
      <div className="absolute top-[68px] left-[70px] text-zinc-800 text-7xl font-black italic tracking-tighter">{player.rating || 60}</div>
      <div className="absolute top-[140px] left-[80px] text-zinc-800 text-3xl font-bold uppercase">{player.position || 'PO'}</div>
      <div className="absolute top-[178px] left-[40px] w-[60px] text-center leading-none text-zinc-700 text-[20px] font-black uppercase">
        {player.team_name?.substring(0,12)}
      </div>
      <div className={`absolute ${pos.nombre} left-0 w-full text-center px-3 text-zinc-900 text-4xl font-black uppercase italic truncate`}>{player.name}</div>
      
      {/* STATS IZQUIERDA */}
      <div className={`absolute ${pos.stats} left-[60px] text-left leading-[40px] font-black text-xl text-zinc-800`}>
        <div className="flex items-center gap-1 text-[30px]"><span>{player.stats?.pac || 60}</span><span className="text-[30px] opacity-50">RIT</span></div>
        <div className="flex items-center gap-1 text-[30px]"><span>{player.stats?.sho || 60}</span><span className="text-[30px] opacity-50">TIR</span></div>
        <div className="flex items-center gap-1 text-[30px]"><span>{player.stats?.pas || 60}</span><span className="text-[30px] opacity-50">PAS</span></div>
      </div>
      
      {/* STATS DERECHA */}
      <div className={`absolute ${pos.stats} left-[182px] text-left leading-[40px] font-black text-xl text-zinc-800`}>
        <div className="flex items-center gap-1 text-[30px]" ><span>{player.stats?.dri || 60}</span><span className="text-[30px] opacity-50">REG</span></div>
        <div className="flex items-center gap-1 text-[30px]"><span>{player.stats?.def || 60}</span><span className="text-[30px] opacity-50">DEF</span></div>
        <div className="flex items-center gap-1 text-[30px]"><span>{player.stats?.phy || 60}</span><span className="text-[30px] opacity-50">FIS</span></div>
      </div>
    </div>
  );
};
export default FutCard;