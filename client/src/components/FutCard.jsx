import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, size = "large", view = "dashboard" }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => { console.warn("AutoPlay bloqueado:", error); });
      }
    }
  }, [player?.rating]);

  if (!player) return null;

  const rating = parseInt(player.rating) || 60;

  const getCardTheme = (r) => {
    // CORRECCIÓN: Ahora carga '/leyenda.png' en vez de '/oro.png'
    if (r >= 90) return {
      img: '/leyenda.png', 
      video: '/particulas_leyenda.mp4',
      glow: "shadow-[0_0_40px_rgba(52,211,153,0.6)]",
      label: "LEYENDA"
    };
    if (r >= 80) return {
      img: '/oro.png',
      video: '/particulas_oro.mp4',
      glow: "shadow-[0_0_30px_rgba(251,191,36,0.5)]",
      label: "ORO"
    };
    if (r >= 70) return {
      img: '/plata.png',
      video: '/particulas_plata.mp4',
      glow: "shadow-[0_0_20px_rgba(255,255,255,0.3)]",
      label: "PLATA"
    };
    return {
      img: '/bronce.png',
      video: '/particulas_bronce.mp4',
      glow: "shadow-xl",
      label: "BRONCE"
    };
  };

  const theme = getCardTheme(rating);

  const getPos = () => {
    if (view === 'voting') {
      return { 
        val: "top-[68px] left-[30px]", pos: "top-[140px] left-[40px]", nom: "top-[240px]", 
        statsY: "top-[266px]", statsX_Izq: "left-[28px]", statsX_Der: "left-[152px]"
      };
    }
    
    // --- AJUSTE ESPECÍFICO SELECCIÓN ---
    if (view === 'selection') {
      return { 
        val: "top-[68px] left-[60px]", 
        pos: "top-[140px] left-[80px]", 
        nom: "top-[285px]", // Bajado para no pisar la silueta
        statsY: "top-[340px]", 
        statsX_Izq: "left-[58px]", 
        statsX_Der: "left-[192px]"
      };
    }

    // DASHBOARD / POR DEFECTO
    return { 
      val: "top-[68px] left-[60px]", pos: "top-[140px] left-[80px]", nom: "top-[270px]", 
      statsY: "top-[340px]", statsX_Izq: "left-[58px]", statsX_Der: "left-[192px]"
    };
  };

  const pos = getPos();
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <motion.div 
        initial={view === 'dashboard' ? { scale: 0, opacity: 0 } : {}}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`relative inline-block ${scales[size]} rounded-[50px] overflow-hidden ${theme.glow} transition-all duration-700`}
    >
      
      <video 
        ref={videoRef}
        key={theme.video}
        className="absolute inset-0 z-0 w-full h-full object-cover rounded-[50px]"
        src={theme.video}
        muted
        autoPlay
        loop
        playsInline
      />

      <motion.div 
        animate={{ x: [-500, 500] }}
        transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 3 }}
        className="absolute inset-0 z-30 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2 -skew-x-12 pointer-events-none"
      />

      <img src={theme.img} alt="Card Base" className="w-[350px] h-auto relative z-10 select-none pointer-events-none" />
      
      <div className={`absolute ${pos.val} z-20 text-zinc-800 text-7xl font-black italic tracking-tighter select-none pointer-events-none`}>
        {rating}
      </div>
      
      <div className={`absolute ${pos.pos} z-20 text-zinc-800 text-2xl font-bold uppercase select-none pointer-events-none`}>
        {player.is_goalkeeper ? 'POR' : (player.position || 'MCO')}
      </div>

      <div className={`absolute ${pos.nom} left-0 w-full text-center px-4 z-20 select-none pointer-events-none`}>
        <span className="text-zinc-900 text-3xl font-black uppercase italic truncate block">
          {player.name}
        </span>
      </div>
      
      <div className={`absolute ${pos.statsY} ${pos.statsX_Izq} z-20 text-left leading-[35px] select-none pointer-events-none`}>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pac || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">RIT</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.sho || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">TIR</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pas || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">PAS</span></div>
      </div>
      
      <div className={`absolute ${pos.statsY} ${pos.statsX_Der} z-20 text-left leading-[35px] select-none pointer-events-none`}>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.dri || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">REG</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.def || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">DEF</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.phy || 60}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">FIS</span></div>
      </div>
    </motion.div>
  );
};

export default FutCard;