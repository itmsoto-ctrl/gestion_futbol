import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, animate } from 'framer-motion';

// 🔢 Contador Animado Limpio y Estable
const RatingCounter = memo(({ targetValue, onComplete }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) return;

    const controls = animate(0, targetValue, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
    
    return () => controls.stop();
  }, [targetValue, onComplete]); 

  return <span>{displayValue}</span>;
});

const FutCard = ({ player, isFlipped, onFlip }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(false);
  
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    // Capturamos el error silenciosamente por si el iPhone también bloquea el autoplay del video
    if (videoRef.current) {
      videoRef.current.play().catch(() => console.log("Autoplay del video bloqueado por el navegador"));
    }
  }, [player?.photo_url]);

  return (
    <div className="relative select-none" style={{ width: '350px', height: '504px', perspective: "2000px", fontFamily: "'Oswald', sans-serif" }}>
      <motion.div
        animate={{ 
          rotateY: isFlipped ? 180 : [-6, 6, -6], 
          rotateX: [2, -2, 2],
          y: [0, -5, 0] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
        onClick={onFlip}
      >
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: "hidden" }}>
          
          {/* ✨ Brillo Metálico Dinámico */}
          <div className="absolute inset-0 z-[40] pointer-events-none">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 animate-[shine_3s_infinite]" />
          </div>

          {/* Fondo de la Carta */}
          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline playsinline webkit-playsinline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {/* 📸 FOTO JUGADOR CON MÁSCARA CORREGIDA (Estilo FUT Exacto) */}
          {player?.photo_url && (
            <div className="absolute top-[12%] right-[8%] w-[65%] h-[50%] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', 
                backgroundPosition: 'center top',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
              }}
            />
          )}

          {/* ⭐ RATING, POSICIÓN Y ESCUDOS */}
          <div className="absolute top-[14%] left-[12%] z-20 flex flex-col items-center text-[#4a3b2c] font-bold text-center">
            <motion.div 
              animate={isRatingDone ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
              className="text-[85px] leading-[0.75] font-black tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-0 opacity-90">{player?.position || 'MCO'}</div>
            <div className="flex flex-col items-center gap-1 mt-2">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm" alt="Flag" />
               <img src={player?.team_logo || '/default-team.png'} className="w-12 h-12 object-contain opacity-90 contrast-125 mt-1" alt="Club" />
            </div>
          </div>

          {/* 👤 NOMBRE JUGADOR CON LÍNEA */}
          <div className="absolute top-[60%] left-0 w-full text-center z-30 text-[#4a3b2c] text-[36px] font-black uppercase italic tracking-tighter mx-auto flex flex-col items-center">
            <span className="px-4 leading-none w-full truncate">{player?.name || 'URIEL BOTAS'}</span>
            <div className="w-[80%] h-[2px] bg-[#4a3b2c]/30 mt-1"></div>
          </div>

          {/* 📊 ESTADÍSTICAS */}
          <div className="absolute top-[71%] left-1/2 -translate-x-1/2 w-[85%] z-30 flex justify-center items-center py-2">
            <div className="flex flex-col gap-0.5 pr-6 border-r-2 border-[#4a3b2c]/30 text-[26px] font-black text-[#4a3b2c] leading-none">
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.pac}</span> <span className="text-[18px] font-medium opacity-80">PAC</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.sho}</span> <span className="text-[18px] font-medium opacity-80">SHO</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.pas}</span> <span className="text-[18px] font-medium opacity-80">PAS</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 pl-6 text-[26px] font-black text-[#4a3b2c] leading-none">
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.dri}</span> <span className="text-[18px] font-medium opacity-80">DRI</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.def}</span> <span className="text-[18px] font-medium opacity-80">DEF</span>
              </div>
              <div className="flex items-center justify-between w-[90px]">
                <span>{stats.phy}</span> <span className="text-[18px] font-medium opacity-80">PHY</span>
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