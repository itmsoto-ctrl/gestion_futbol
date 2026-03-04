import React, { useRef, useEffect, useState } from 'react';
import { motion, animate, useMotionValue, useTransform } from 'framer-motion';

// 🔢 Rating con subida única y suave
const RatingCounter = ({ targetValue, onComplete }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Solo animamos si tenemos un valor real y no hemos animado ya este valor
    if (targetValue > 0 && !hasAnimated.current) {
      const controls = animate(0, targetValue, {
        duration: 2,
        ease: [0.22, 1, 0.36, 1], // Ease "Expo Out" para un final muy suave
        onUpdate: (value) => setDisplayValue(Math.floor(value)),
        onComplete: () => {
          hasAnimated.current = true;
          if (onComplete) onComplete();
        }
      });
      return () => controls.stop();
    }
  }, [targetValue, onComplete]);

  return <span>{displayValue || targetValue}</span>;
};

const FutCard = ({ player, isFlipped, onFlip, children }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(false);
  
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  return (
    <div 
      className="relative select-none" 
      style={{ width: '350px', height: '504px', perspective: "2500px" }}
      onClick={onFlip}
    >
      <motion.div
        // ✅ BALANCEO REFINADO: Más lento y con más arco (Y: 15deg, X: 4deg)
        animate={{ 
            rotateY: isFlipped ? 180 : [-15, 15, -15], 
            rotateX: [4, -4, 4],
            y: [0, -10, 0] // Efecto flotante leve
        }}
        transition={{ 
            rotateY: isFlipped ? { duration: 0.8, ease: "circOut" } : { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ width: '100%', height: '100%', transformStyle: "preserve-3d" }}
      >
        {/* --- CARA FRONT --- */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]" style={{ backfaceVisibility: "hidden" }}>
          
          <div className="absolute inset-0 z-[40] pointer-events-none overflow-hidden rounded-[45px]">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 animate-[shine_5s_infinite] translate-x-[-100%]" />
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

          {/* RATING Y POSICIÓN */}
          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#3a2d0f] font-bold font-oswald">
            <motion.div 
              animate={isRatingDone ? { 
                scale: [1, 1.25, 1], 
                filter: ["brightness(1)", "brightness(2.5)", "brightness(1)"],
                textShadow: ["0 0 0px transparent", "0 0 25px rgba(245,158,11,0.8)", "0 0 5px rgba(245,158,11,0.3)"]
              } : {}}
              transition={{ duration: 0.8 }}
              className="text-[85px] leading-[0.7] tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-1 opacity-90">{player?.position || 'MCO'}</div>
            
            <div className="flex flex-col items-center gap-2 mt-3">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm border border-black/5" alt="Flag" />
               {/* ✅ LOGO CLUB: Quitada silueta negra para evitar cuadrados, ahora con brillo sutil */}
               <img src={player?.team_logo || '/default-team.png'} className="w-11 h-11 object-contain opacity-90 contrast-125" alt="Club" />
            </div>
          </div>

          <div className="absolute top-[285px] left-0 w-full text-center z-30 text-[#3a2d0f] font-oswald text-[36px] font-black uppercase italic tracking-tighter border-b border-[#3a2d0f]/10 pb-1 mx-auto w-[80%]">
            {player?.name || 'URIEL BOTAS'}
          </div>

          {/* STATS DIVISIÓN CLÁSICA */}
          <div className="absolute top-[345px] left-1/2 -translate-x-1/2 w-[80%] z-30 flex justify-center items-center py-2">
            <div className="flex flex-col gap-0.5 pr-6 border-r border-[#3a2d0f]/20">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.pac}</span> <span className="text-[18px] opacity-70 italic">PAC</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.sho}</span> <span className="text-[18px] opacity-70 italic">SHO</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.pas}</span> <span className="text-[18px] opacity-70 italic">PAS</span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 pl-6">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.dri}</span> <span className="text-[18px] opacity-70 italic">DRI</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.def}</span> <span className="text-[18px] opacity-70 italic">DEF</span>
              </div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none">
                <span>{stats.phy}</span> <span className="text-[18px] opacity-70 italic">PHY</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARA BACK --- */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl" 
          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", backgroundImage: "url('/bronce_back.webp')", backgroundSize: 'cover' }}
        >
          <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;