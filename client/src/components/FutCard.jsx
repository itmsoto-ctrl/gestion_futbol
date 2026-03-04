import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, isFlipped, onFlip, children, size = "large" }) => {
  const videoRef = useRef(null);
  useEffect(() => { if (videoRef.current) videoRef.current.play().catch(() => {}); }, [player?.photo_url]);

  const sizes = { large: { w: 350, s: 1 } }; // Mantenemos la base de 350px
  const current = sizes[size] || sizes.large;

  return (
    <div 
      className="relative cursor-pointer"
      style={{ width: `${current.w}px`, height: `${current.w * 1.44}px`, perspective: "2000px" }}
      onClick={onFlip} // 👈 Giro táctil al tocar cualquier parte de la carta
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
      >
        {/* --- CARA FRONT (BRONCE) --- */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: "hidden" }}>
          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-30" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {/* FOTO: Si no hay foto, el diseño de bronce sigue viéndose impecable */}
          {player?.photo_url && (
            <div className="absolute top-[12px] left-[112px] w-[240px] h-[280px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center 10%',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
              }}
            />
          )}

          {/* DATOS FRONT (Rating, Nombre, Stats...) */}
          <div className="absolute top-[55px] left-[43px] z-20 flex flex-col items-center text-amber-950 font-bold font-oswald">
            <div className="text-[92px] leading-[0.7]">{player?.rating || 75}</div>
            <div className="text-[28px] uppercase">{player?.position || 'DEL'}</div>
            <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 mt-4" alt="Flag" />
          </div>
          <div className="absolute top-[282px] left-0 w-full text-center z-30 text-amber-950 font-oswald text-[38px] uppercase italic">
            {player?.name || 'JUGADOR'}
          </div>
        </div>

        {/* --- CARA BACK (FICHA TÉCNICA) --- */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl bg-white"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", backgroundImage: "url('/bronce_back.webp')", backgroundSize: 'cover' }}
        >
          {/* Evitamos que el clic en los inputs gire la carta por error */}
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;