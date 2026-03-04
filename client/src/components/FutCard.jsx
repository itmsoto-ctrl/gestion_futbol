import React, { useRef, useEffect, useState } from 'react';
// ✅ CAMBIADO: De 'motion/react' a 'framer-motion'
import { motion, animate } from 'framer-motion';

// 🔢 Componente para la animación de cuenta progresiva
const StatCounter = ({ targetValue }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animación de 0 al valor objetivo
    const controls = animate(0, targetValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => setDisplayValue(Math.floor(value)),
    });
    return () => controls.stop();
  }, [targetValue]);

  return <span>{displayValue}</span>;
};

const FutCard = ({ player, isFlipped, onFlip, children, size = "large" }) => {
  const videoRef = useRef(null);
  
  // 🛡️ Stats: Si no hay datos, usamos 60 por defecto
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  const sizes = { large: { w: 350, h: 504 } }; 
  const current = sizes[size] || sizes.large;

  return (
    <div 
      className="relative cursor-pointer group select-none"
      style={{ width: `${current.w}px`, height: `${current.h}px`, perspective: "2000px" }}
      onClick={onFlip}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        whileHover={{ rotateX: -5, rotateY: 5, scale: 1.02 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
      >
        {/* --- CARA FRONT --- */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: "hidden" }}>
          
          {/* Brillo Metálico */}
          <div className="absolute inset-0 z-[40] pointer-events-none overflow-hidden rounded-[45px]">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 animate-[shine_4s_infinite] translate-x-[-100%]" />
          </div>

          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {/* FOTO JUGADOR */}
          {player?.photo_url && (
            <div className="absolute top-[35px] left-[115px] w-[215px] h-[255px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center 10%',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)',
              }}
            />
          )}

          {/* COLUMNA IZQUIERDA (Rating animado) */}
          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#3a2d0f] font-bold font-oswald">
            <div className="text-[85px] leading-[0.7] tracking-tighter">
              <StatCounter targetValue={rating} />
            </div>
            <div className="text-[26px] uppercase mt-1 opacity-90">{player?.position || 'MCO'}</div>
            
            <div className="flex flex-col items-center gap-2 mt-3">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm border border-black/5" alt="Flag" />
               <img src={player?.team_logo || '/default-team.png'} className="w-11 h-11 object-contain brightness-0 opacity-80" alt="Club" />
            </div>
          </div>

          {/* NOMBRE DEL JUGADOR */}
          <div className="absolute top-[285px] left-0 w-full text-center z-30 text-[#3a2d0f] font-oswald text-[36px] font-black uppercase italic tracking-tighter border-b border-[#3a2d0f]/10 pb-1 mx-auto w-[80%]">
            {player?.name || 'JUGADOR'}
          </div>

          {/* 📊 SECCIÓN DE STATS ANIMADOS */}
          <div className="absolute top-[345px] left-1/2 -translate-x-1/2 w-[80%] z-30 flex justify-center items-center py-2">
            
            {/* Columna 1 */}
            <div className="flex flex-col gap-0.5 pr-6 border-r border-[#3a2d0f]/20">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.pac} /> <span className="text-[18px] opacity-70">PAC</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.sho} /> <span className="text-[18px] opacity-70">SHO</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.pas} /> <span className="text-[18px] opacity-70">PAS</span>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="flex flex-col gap-0.5 pl-6">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.dri} /> <span className="text-[18px] opacity-70">DRI</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.def} /> <span className="text-[18px] opacity-70">DEF</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <StatCounter targetValue={stats.phy} /> <span className="text-[18px] opacity-70">PHY</span>
              </div>
            </div>

          </div>
        </div>

        {/* --- CARA BACK --- */}
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