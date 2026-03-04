import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, isFlipped, onFlip, children, size = "large" }) => {
  const videoRef = useRef(null);
  
  // 🛡️ GARANTÍA DE STATS: Si no vienen del servidor, forzamos 60 para que luzca
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  const sizes = { large: { w: 350, h: 504 } }; 
  const current = sizes[size] || sizes.large;

  // 📳 Función de giro con vibración táctica
  const handleFlip = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(20); // Vibración corta al girar
    onFlip();
  };

  return (
    <div 
      className="relative cursor-pointer group"
      style={{ width: `${current.w}px`, height: `${current.h}px`, perspective: "2000px" }}
      onClick={handleFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        whileHover={{ rotateX: -5, rotateY: 5, scale: 1.02 }} // ✅ Movimiento sutil al pasar el dedo
        transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
      >
        {/* --- CARA FRONT (DISEÑO BRONCE + STATS) --- */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: "hidden" }}>
          
          {/* 💡 EFECTO BRILLO METÁLICO (SHINE) */}
          <div className="absolute inset-0 z-[40] pointer-events-none overflow-hidden rounded-[45px]">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 animate-[shine_4s_infinite] translate-x-[-100%]" />
          </div>

          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {player?.photo_url && (
            <div className="absolute top-[12px] left-[112px] w-[240px] h-[280px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center 10%',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 80%)',
              }}
            />
          )}

          {/* DATOS SUPERIORES */}
          <div className="absolute top-[55px] left-[43px] z-20 flex flex-col items-center text-amber-950 font-bold font-oswald">
            <div className="text-[92px] leading-[0.7]">{player?.rating || 75}</div>
            <div className="text-[28px] uppercase">{player?.position || 'DEL'}</div>
            <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 mt-4 shadow-sm" alt="Flag" />
          </div>

          <div className="absolute top-[282px] left-0 w-full text-center z-30 text-amber-950 font-oswald text-[38px] uppercase italic tracking-tighter">
            {player?.name || 'JUGADOR'}
          </div>

          {/* ✅ SECCIÓN DE STATS (Añadida para que no esté vacía) */}
          <div className="absolute top-[355px] left-1/2 -translate-x-1/2 w-[75%] z-30 grid grid-cols-2 gap-x-8 gap-y-0.5 border-t border-amber-950/20 pt-3">
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.pac}</span> <span>PAC</span></div>
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.dri}</span> <span>DRI</span></div>
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.sho}</span> <span>SHO</span></div>
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.def}</span> <span>DEF</span></div>
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.pas}</span> <span>PAS</span></div>
            <div className="flex justify-between text-[22px] font-black text-amber-950/80 font-oswald"><span>{stats.phy}</span> <span>PHY</span></div>
          </div>
        </div>

        {/* --- CARA BACK (FICHA TÉCNICA) --- */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl"
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", backgroundImage: "url('/bronce_back.webp')", backgroundSize: 'cover' }}
        >
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;