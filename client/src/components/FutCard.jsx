import React, { useRef, useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';
import useInteractionSounds from '../hooks/useInteractionSounds';

const RatingCounter = ({ targetValue, onComplete }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const { playScore } = useInteractionSounds();
  const hasAnimated = useRef(sessionStorage.getItem('rating_done'));

  useEffect(() => {
    // Si ya animó antes, mostrar el valor final directamente
    if (hasAnimated.current === 'true') {
      setDisplayValue(targetValue);
      if (onComplete) onComplete();
      return;
    }

    // Animación de subida única
    playScore(0.3);
    const controls = animate(0, targetValue, {
      duration: 1.8,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
      onComplete: () => {
        sessionStorage.setItem('rating_done', 'true');
        if (onComplete) onComplete();
      }
    });
    return () => controls.stop();
  }, [targetValue, onComplete, playScore]);

  return <span>{displayValue}</span>;
};

const FutCard = ({ player, isFlipped, onFlip, children }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(false);
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  return (
    <div className="relative select-none" style={{ width: '350px', height: '504px', perspective: "2000px" }}>
      <motion.div
        animate={{ 
          rotateY: isFlipped ? 180 : [-6, 6, -6], // Giro más suave
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
          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {player?.photo_url && (
            <div className="absolute top-[35px] left-[115px] w-[215px] h-[255px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center 10%',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 85%)',
              }}
            />
          )}

          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#3a2d0f] font-bold font-oswald">
            <motion.div 
              animate={isRatingDone ? { scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(2.2)", "brightness(1)"] } : {}}
              className="text-[85px] font-black leading-[0.7] tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-1 opacity-90">{player?.position || 'MCO'}</div>
            <div className="flex flex-col items-center gap-2 mt-3">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm" alt="Flag" />
               <img src={player?.team_logo || '/default-team.png'} className="w-11 h-11 object-contain opacity-90 contrast-125" alt="Club" />
            </div>
          </div>

          <div className="absolute top-[285px] left-0 w-full text-center z-30 text-[#3a2d0f] font-oswald text-[36px] font-black uppercase italic tracking-tighter border-b border-[#3a2d0f]/10 pb-1 mx-auto w-[80%]">
            {player?.name || 'URIEL BOTAS'}
          </div>

          <div className="absolute top-[345px] left-1/2 -translate-x-1/2 w-[80%] z-30 flex justify-center items-center py-2">
            <div className="flex flex-col gap-0.5 pr-6 border-r border-[#3a2d0f]/20">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.pac}</span> <span className="text-[18px] opacity-70">PAC</span></div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.sho}</span> <span className="text-[18px] opacity-70">SHO</span></div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.pas}</span> <span className="text-[18px] opacity-70">PAS</span></div>
            </div>
            <div className="flex flex-col gap-0.5 pl-6">
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.dri}</span> <span className="text-[18px] opacity-70">DRI</span></div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.def}</span> <span className="text-[18px] opacity-70">DEF</span></div>
              <div className="flex items-center gap-2 text-[24px] font-black text-[#3a2d0f] font-oswald leading-none"><span>{stats.phy}</span> <span className="text-[18px] opacity-70">PHY</span></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;