import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, animate } from 'framer-motion';

// 🔢 Contador Animado Blindado (Versión Definitiva)
const RatingCounter = memo(({ targetValue, onComplete }) => {
  const [displayValue, setDisplayValue] = useState(() => {
    const done = sessionStorage.getItem('vora_rating_done');
    return done === 'true' ? targetValue : 0;
  });
  
  const animatedRef = useRef(false);

  useEffect(() => {
    const isDone = sessionStorage.getItem('vora_rating_done');
    
    // Si ya animó antes o si el valor es 0, no hacer nada
    if (isDone === 'true' || targetValue === 0 || animatedRef.current) {
      setDisplayValue(targetValue);
      if (onComplete) onComplete();
      return;
    }

    animatedRef.current = true;

    const controls = animate(0, targetValue, {
      duration: 2,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
      onComplete: () => {
        sessionStorage.setItem('vora_rating_done', 'true');
        if (onComplete) onComplete();
      }
    });
    return () => controls.stop();
  }, [targetValue, onComplete]);

  return <span>{displayValue}</span>;
});

const FutCard = ({ player, isFlipped, onFlip }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(() => {
    return sessionStorage.getItem('vora_rating_done') === 'true';
  });

  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [player?.photo_url]);

  return (
    <div className="relative select-none" style={{ width: '350px', height: '504px', perspective: "2000px", fontFamily: "'Oswald', sans-serif" }}>
      <motion.div
        animate={{ 
          rotateY: isFlipped ? 180 : [-8, 8, -8], 
          rotateX: [2, -2, 2],
          y: [0, -5, 0] 
        }}
        transition={{ 
          rotateY: isFlipped ? { duration: 0.8 } : { duration: 8, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
        onClick={onFlip}
      >
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: "hidden" }}>
          
          {/* ✨ Brillo Metálico Dinámico */}
          <div className="absolute inset-0 z-[40] pointer-events-none">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 animate-[shine_3s_infinite]" />
          </div>

          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {/* 👇👇👇 AQUÍ AJUSTAS LA ALTURA DE LA FOTO (Cambia el top-[20px]) 👇👇👇 */}
          {player?.photo_url && (
            <div className="absolute top-[20px] left-[115px] w-[215px] h-[255px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', 
                backgroundPosition: 'center 10%',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)',
                maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)',
              }}
            />
          )}
          {/* 👆👆👆 FIN DEL BLOQUE DE LA FOTO 👆👆👆 */}

          {/* ⭐ RATING Y POSICIÓN */}
          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#4a3b2c] font-bold text-center">
            <motion.div 
              animate={isRatingDone ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
              className="text-[85px] leading-[0.75] font-black tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-0 opacity-90">{player?.position || 'MCO'}</div>
            <div className="flex flex-col items-center gap-1 mt-2">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm border border-[#4a3b2c]/10" alt="Flag" />
               <img src={player?.team_logo || '/default-team.png'} className="w-12 h-12 object-contain opacity-90 contrast-125 mt-1" alt="Club" />
            </div>
          </div>

          {/* 👤 NOMBRE JUGADOR (Sin cursiva y con línea) */}
          <div className="absolute top-[290px] left-0 w-full text-center z-30 text-[#4a3b2c] text-[36px] font-black uppercase tracking-tighter mx-auto flex flex-col items-center">
            <span className="px-4 leading-none w-full truncate">{player?.name || 'JUGADOR'}</span>
            <div className="w-[70%] h-[2px] bg-[#4a3b2c]/30 mt-1"></div>
          </div>

          {/* 📊 ESTADÍSTICAS EN ESPAÑOL */}
          <div className="absolute top-[335px] left-1/2 -translate-x-1/2 w-[85%] z-30 flex justify-center items-center py-2">
            <div className="flex flex-col gap-0.5 pr-6 border-r-2 border-[#4a3b2c]/30 text-[26px] font-black text-[#4a3b2c] leading-none">
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.pac}</span> <span className="text-[18px] font-medium opacity-80">RIT</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.sho}</span> <span className="text-[18px] font-medium opacity-80">TIR</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.pas}</span> <span className="text-[18px] font-medium opacity-80">PAS</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 pl-6 text-[26px] font-black text-[#4a3b2c] leading-none">
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.dri}</span> <span className="text-[18px] font-medium opacity-80">REG</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.def}</span> <span className="text-[18px] font-medium opacity-80">DEF</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.phy}</span> <span className="text-[18px] font-medium opacity-80">FIS</span>
              </div>
            </div>
          </div>

        </div>

        {/* 🔄 CARA TRASERA */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl bg-[#2a2218]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
             <img src="/logo-vora.png" alt="Vora" className="w-1/2 opacity-30" />
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default FutCard;