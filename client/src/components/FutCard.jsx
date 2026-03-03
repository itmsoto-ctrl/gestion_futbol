import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, size = "large" }) => {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current) videoRef.current.play().catch(() => {}); }, [player?.photo_url]);

  if (!player) return null;
  const rating = parseInt(player.rating) || 85;
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <motion.div className={`relative inline-block ${scales[size]} rounded-[50px] overflow-hidden shadow-2xl transition-all duration-700`}>
      <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
      <motion.div animate={{ x: [-500, 500] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 z-[5] bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 -skew-x-12 pointer-events-none" />
      <img src="/oro.png" alt="Card" className="w-[350px] h-auto relative z-10 select-none pointer-events-none" />
      
      {/* 📸 FOTO CON MÉTODO DE FONDO (MÁXIMA COMPATIBILIDAD IOS) */}
      {player.photo_url && (
        <div 
          className="absolute top-[68px] left-[95px] w-[200px] h-[215px] z-[15] pointer-events-none"
          style={{
            // La foto se pone como fondo del div
            backgroundImage: `url(${player.photo_url})`,
            backgroundSize: 'contain',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
            // Aplicamos la máscara al div directamente
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 95%)',
            filter: 'brightness(1.05) contrast(1.05)'
          }}
        />
      )}

      {/* TEXTOS Y STATS (Igual que antes) */}
      <div className="absolute top-[68px] left-[60px] z-20 text-zinc-800 text-7xl font-black italic tracking-tighter">{rating}</div>
      <div className="absolute top-[140px] left-[80px] z-20 text-zinc-800 text-2xl font-bold uppercase">{player.position || 'DEL'}</div>
      <div className="absolute top-[285px] left-0 w-full text-center z-20 px-4"><span className="text-zinc-900 text-3xl font-black uppercase italic truncate block">{player.name}</span></div>
      
      <div className="absolute top-[340px] left-[58px] z-20 text-left leading-[35px]">
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pac || 80}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">RIT</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.sho || 85}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">TIR</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pas || 72}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">PAS</span></div>
      </div>
      <div className="absolute top-[340px] left-[192px] z-20 text-left leading-[35px]">
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.dri || 84}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">REG</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.def || 35}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">DEF</span></div>
        <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.phy || 70}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">FIS</span></div>
      </div>
    </motion.div>
  );
};
export default FutCard;