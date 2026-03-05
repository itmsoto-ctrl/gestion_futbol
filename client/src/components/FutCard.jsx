import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, animate } from 'framer-motion';
import useInteractionSounds from '../hooks/useInteractionSounds';

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
      return;
    }
    hasStarted.current = true;
    if (playScore) playScore(0.3); 
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
  }, [targetValue, onComplete, playScore]);

  return <span>{displayValue}</span>;
});

const FutCard = ({ player, isFlipped, onFlip }) => {
  const videoRef = useRef(null);
  const [isRatingDone, setIsRatingDone] = useState(() => sessionStorage.getItem('vora_rating_done') === 'true');
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  return (
    <div className="relative select-none" style={{ width: '350px', height: '504px', perspective: "2000px" }}>
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
          
          {/* ✨ CAPA DE BRILLO METÁLICO DINÁMICO */}
          <div className="absolute inset-0 z-[40] pointer-events-none overflow-hidden rounded-[45px]">
            <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/20 to-transparent rotate-45 animate-[shine_3s_infinite]" />
          </div>

          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card" className="w-full h-auto relative z-10" />
          
          <div className="absolute top-[60px] left-[45px] z-20 flex flex-col items-center text-[#3a2d0f] font-bold font-oswald text-center">
            <motion.div 
              animate={isRatingDone ? { scale: [1, 1.2, 1], filter: ["brightness(1)", "brightness(2.5)", "brightness(1)"] } : {}}
              className="text-[85px] leading-[0.7] font-black tracking-tighter"
            >
              <RatingCounter targetValue={rating} onComplete={() => setIsRatingDone(true)} />
            </motion.div>
            <div className="text-[26px] uppercase mt-1 opacity-90">{player?.position || 'MCO'}</div>
          </div>
          {/* ... resto del diseño de stats y nombre se mantiene intacto ... */}
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;