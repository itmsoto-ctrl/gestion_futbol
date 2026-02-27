import React from 'react';
import { motion } from 'framer-motion';

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
    if (view === 'selection') return { nombre: "top-[285px]", stats: "top-[345px]" };
    // Mantenemos tu ajuste de 320px que tenías antes de mi error
    return { nombre: "top-[275px]", stats: "top-[320px]" };
  };

  const pos = getPos();
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  const StatLine = ({ label, value }) => (
    <div className="flex items-center gap-5">
      <span className="text-zinc-800 font-black text-3xl w-7">{value || 60}</span>
      <span className="text-zinc-700 font-bold text-3xl uppercase opacity-70">{label}</span>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes custom-shine {
            0% { transform: translateX(-200%) skewX(-15deg); }
            100% { transform: translateX(200%) skewX(-15deg); }
          }
          .animate-custom-shine {
            animation: custom-shine 3.5s infinite linear;
          }
        `}
      </style>

      <motion.div 
          initial={view === 'dashboard' ? { rotateY: 720, scale: 0, opacity: 0 } : {}}
          animate={view === 'dashboard' ? { rotateY: 0, scale: 1, opacity: 1 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          // ELIMINADO EL RECTÁNGULO: overflow-hidden AQUÍ para que el brillo respete la forma de la carta
          className={`relative inline-block left-[20px] ${scales[size]} transition-all duration-500 rounded-[50px] overflow-hidden shadow-2xl`}
      >
        {/* EFECTO DE DESTELLO: Ahora dentro del contenedor con overflow-hidden */}
        {view === 'dashboard' && (
          <div className="absolute inset-0 pointer-events-none z-30">
             <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-custom-shine absolute" />
          </div>
        )}

        {/* IMAGEN DE FONDO */}
        <img src={getCardImage(player.rating)} alt="Card" className="w-[350px] h-auto relative z-10" />

        {/* RATING */}
        <div className="absolute top-[68px] left-[60px] z-20 text-zinc-800 text-7xl font-black italic tracking-tighter">
          {player.rating || 60}
        </div>

        {/* POSICIÓN */}
        <div className="absolute top-[140px] left-[80px] z-20 text-zinc-800 text-2xl font-bold uppercase">
          {player.position || 'PO'}
        </div>

        {/* NOMBRE JUGADOR */}
        <div className={`absolute ${pos.nombre} left-0 w-full text-center px-4 z-20`}>
          <span className="text-zinc-900 text-3xl font-black uppercase tracking-tighter truncate block italic">{player.name}</span>
        </div>

        {/* STATS IZQUIERDA - Recuperada tu posición left-[58px] */}
        <div className={`absolute ${pos.stats} left-[58px] z-20 text-left leading-[35px]`}>
          <StatLine label="RIT" value={player.stats?.pac} />
          <StatLine label="TIR" value={player.stats?.sho} />
          <StatLine label="PAS" value={player.stats?.pas} />
        </div>

        {/* STATS DERECHA - Recuperada tu posición left-[192px] */}
        <div className={`absolute ${pos.stats} left-[192px] z-20 text-left leading-[35px]`}>
          <StatLine label="REG" value={player.stats?.dri} />
          <StatLine label="DEF" value={player.stats?.def} />
          <StatLine label="FIS" value={player.stats?.phy} />
        </div>
      </motion.div>
    </>
  );
};

export default FutCard;