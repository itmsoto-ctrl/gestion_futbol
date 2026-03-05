import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, animate } from 'framer-motion';
import useInteractionSounds from '../hooks/useInteractionSounds';

// 🔢 Contador Animado Blindado
const RatingCounter = memo(({ targetValue, onComplete }) => {
  const [displayValue, setDisplayValue] = useState(() => {
    const isDone = sessionStorage.getItem('vora_rating_done');
    return isDone === 'true' ? targetValue : 0;
  });
  
  const { playScore } = useInteractionSounds();
  const hasStarted = useRef(false);

  useEffect(() => {
    const isDone = sessionStorage.getItem('vora_rating_done');
    if (isDone === 'true' || targetValue === 0 || hasStarted.current) {
      if (targetValue > 0) setDisplayValue(targetValue);
      if (onComplete) onComplete();
      return;
    }
    
    hasStarted.current = true;
    if (playScore) playScore(0.3); 
    
    const controls = animate(0, targetValue, {
      duration: 1.5,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
      onComplete: () => {
        sessionStorage.setItem('vora_rating_done', 'true');
        if (onComplete) onComplete();
      }
    });
    return () => controls.stop();
  }, [targetValue, onComplete, playScore]);

  return <span>{displayValue}</span>;
});

const FutCard = ({ player, isFlipped, onFlip }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(() => sessionStorage.getItem('vora_rating_done') === 'true');
  
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {});
  }, [player?.photo_url]);

  return (
    // Aplicamos la fuente Oswald directamente aquí
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
          
          {/* ✨ Brillo Metálico */}
          <div className="absolute inset-0 z-[40] pointer-events-none">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 animate-[shine_3s_infinite]" />
          </div>

          {/* Fondo Base */}
          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          {/* FOTO JUGADOR CON DIFUMINADO INFERIOR (Estilo FUT) */}
          {player?.photo_url && (
            <div className="absolute top-[35px] left-[115px] w-[215px] h-[255px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', 
                backgroundPosition: 'center 10%',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
              }}
            />
          )}

          {/* RATING Y POSICION */}
          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#3a2d0f] font-bold text-center">
            <motion.div 
              animate={isRatingDone ? { scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] } : {}}
              className="text-[85px] leading-[0.7] font-black tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-1 opacity-90">{player?.position || 'MCO'}</div>
            <div className="flex flex-col items-center gap-2 mt-2">
               <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-10 shadow-sm" alt="Flag" />
               <img src={player?.team_logo || '/default-team.png'} className="w-11 h-11 object-contain opacity-90 contrast-125" alt="Club" />
            </div>
          </div>

          {/* NOMBRE JUGADOR Y LÍNEA SEPARADORA */}
          <div className="absolute top-[290px] left-0 w-full text-center z-30 text-[#3a2d0f] text-[36px] font-black uppercase italic tracking-tighter mx-auto flex flex-col items-center">
            <span className="px-4 leading-none">{player?.name || 'URIEL BOTAS'}</span>
            <div className="w-[70%] h-[2px] bg-[#3a2d0f]/20 mt-2"></div>
          </div>

          {/* ESTADÍSTICAS EN REJILLA */}
          <div className="absolute top-[355px] left-1/2 -translate-x-1/2 w-[80%] z-30 flex justify-center items-center py-2">
            {/* Columna Izquierda */}
            <div className="flex flex-col gap-0.5 pr-5 border-r-2 border-[#3a2d0f]/20 text-[24px] font-black text-[#3a2d0f] leading-none">
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.pac}</span> <span className="text-[18px] font-medium opacity-80">PAC</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.sho}</span> <span className="text-[18px] font-medium opacity-80">SHO</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.pas}</span> <span className="text-[18px] font-medium opacity-80">PAS</span></div>
            </div>
            {/* Columna Derecha */}
            <div className="flex flex-col gap-0.5 pl-5 text-[24px] font-black text-[#3a2d0f] leading-none">
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.dri}</span> <span className="text-[18px] font-medium opacity-80">DRI</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.def}</span> <span className="text-[18px] font-medium opacity-80">DEF</span></div>
              <div className="flex items-center gap-2"><span className="w-8 text-right">{stats.phy}</span> <span className="text-[18px] font-medium opacity-80">PHY</span></div>
            </div>
          </div>

        </div>

        {/* CARA TRASERA */}
        <div className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl bg-[#3a2d0f]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <div className="absolute inset-0 flex items-center justify-center">
             <img src="/logo-vora.png" alt="Vora" className="w-1/2 opacity-30" />
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default FutCard;