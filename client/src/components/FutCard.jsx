import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, size = "large" }) => {
  const videoRef = useRef(null);

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  if (!player) return null;
  const rating = parseInt(player.rating) || 75;
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
        transition={{ duration: 0.8, y: { repeat: Infinity, duration: 4, ease: "easeInOut" } }}
        style={{ fontFamily: "'Oswald', sans-serif" }}
        className={`relative inline-block ${scales[size]} rounded-[45px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)]`}
    >
      {/* 1. VÍDEO Y FONDO */}
      <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-30" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
      <motion.div animate={{ x: [-600, 600] }} transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 4 }} className="absolute inset-0 z-[6] bg-gradient-to-r from-transparent via-white/10 to-transparent w-full -skew-x-12 pointer-events-none" />

      <img src="/bronce.png" alt="Card Bronze" className="w-[350px] h-auto relative z-10 select-none pointer-events-none" />
      
      {/* 📸 FOTO JUGADOR: REDUCIDA Y REUBICADA */}
      {player.photo_url && (
        <div className="absolute top-[12px] left-[112px] w-[240px] h-[280px] z-[15] pointer-events-none"
          style={{
            backgroundImage: `url(${player.photo_url})`,
            backgroundSize: 'cover', backgroundPosition: 'center 10%', backgroundRepeat: 'no-repeat',
            // Máscara radial ajustada para la nueva escala
            WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
            maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
            filter: 'brightness(1.05) contrast(1.05)',
          }}
        />
      )}

      {/* 🏆 COLUMNA IZQUIERDA (Rating y POS) */}
      <div className="absolute top-[55px] left-[43px] z-20 flex flex-col items-center gap-0 text-amber-950">
        <div className="text-[92px] font-bold leading-[0.7] tracking-[-0.06em]" style={{ transform: "scaleX(0.85)" }}>
          {rating}
        </div>
        <div className="text-[28px] font-bold uppercase tracking-[-0.02em] mt-1" style={{ transform: "scaleX(0.9)" }}>
          {player.position || 'DEL'}
        </div>
        
        <div className="h-[2px] w-12 bg-amber-950/20 my-2" /> 
        <img src="https://flagcdn.com/w80/es.png" className="w-10 h-auto shadow-sm" alt="Flag" />
        <img src="/logo_club.png" className="w-12 h-12 object-contain mt-1" alt="Club" />
      </div>

      {/* 👤 NOMBRE: Dani, aquí el texto está anclado para que no se mueva */}
      <div className="absolute top-[282px] left-0 w-full text-center z-30 px-2 pointer-events-none">
        <span className="text-amber-950 text-[38px] font-bold uppercase italic tracking-[-0.04em] leading-none"
              style={{ display: 'inline-block', transform: "scaleX(0.88)" }}>
          {player.name}
        </span>
      </div>

      {/* 📊 STATS (Color ámbar oscuro para bronce) */}
      <div className="absolute top-[345px] left-0 w-full flex justify-center items-center z-20 px-10 text-amber-950">
        <div className="flex flex-col text-right pr-6 gap-0">
          <div className="flex items-center gap-2"><span className="font-bold text-3xl">{player.pac || 65}</span><span className="font-bold text-xl opacity-70">RIT</span></div>
          <div className="flex items-center gap-2"><span className="font-bold text-3xl">{player.sho || 60}</span><span className="font-bold text-xl opacity-70">TIR</span></div>
          <div className="flex items-center gap-2"><span className="font-bold text-3xl">{player.pas || 58}</span><span className="font-bold text-xl opacity-70">PAS</span></div>
        </div>
        <div className="w-[1.5px] h-20 bg-amber-950/20 mx-1" />
        <div className="flex flex-col text-left pl-6 gap-0">
          <div className="flex items-center gap-2"><span className="font-bold text-xl opacity-70">REG</span><span className="font-bold text-3xl">{player.dri || 62}</span></div>
          <div className="flex items-center gap-2"><span className="font-bold text-xl opacity-70">DEF</span><span className="font-bold text-3xl">{player.def || 45}</span></div>
          <div className="flex items-center gap-2"><span className="font-bold text-xl opacity-70">FIS</span><span className="font-bold text-3xl">{player.phy || 70}</span></div>
        </div>
      </div>
    </motion.div>
  );
};

export default FutCard;