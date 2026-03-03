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
      <img src="/oro.png" alt="Card" className="w-[350px] h-auto relative z-10 pointer-events-none" />
      
      {player.photo_url && (
        <div className="absolute top-[70px] left-[95px] w-[200px] h-[215px] z-[15] pointer-events-none" style={{ isolation: 'isolate' }}>
          <div style={{ 
            width: '100%', height: '100%', 
            WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 98%)',
            maskImage: 'linear-gradient(to bottom, black 65%, transparent 98%)'
          }}>
            <img src={player.photo_url} alt="Jugador" className="w-full h-full object-contain object-bottom brightness-[1.05] contrast-[1.05]" />
          </div>
        </div>
      )}

      <div className="absolute top-[68px] left-[60px] z-20 text-zinc-800 text-7xl font-black italic">{rating}</div>
      <div className="absolute top-[140px] left-[80px] z-20 text-zinc-800 text-2xl font-bold uppercase">{player.position || 'DEL'}</div>
      <div className="absolute top-[285px] left-0 w-full text-center z-20 px-4"><span className="text-zinc-900 text-3xl font-black uppercase italic truncate block">{player.name}</span></div>
      
      {/* Stats Simplificadas */}
      <div className="absolute top-[340px] left-[58px] z-20 text-left leading-[35px] text-zinc-800 font-black text-3xl">
        <div>{player.pac || 80}</div><div>{player.sho || 85}</div><div>{player.pas || 72}</div>
      </div>
      <div className="absolute top-[340px] left-[192px] z-20 text-left leading-[35px] text-zinc-800 font-black text-3xl">
        <div>{player.dri || 84}</div><div>{player.def || 35}</div><div>{player.phy || 70}</div>
      </div>
    </motion.div>
  );
};
export default FutCard;