import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const FutCard = ({ player, isFlipped = false, children, size = "large" }) => {
  const videoRef = useRef(null);

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  if (!player) return null;

  const sizes = {
    mini: { w: 80, s: 80 / 350 },
    squad: { w: 150, s: 150 / 350 },
    medium: { w: 280, s: 280 / 350 },
    large: { w: 350, s: 1 }
  };

  const current = sizes[size] || sizes.large;
  const rating = parseInt(player.rating) || 75;

  return (
    <div 
      className="relative inline-block"
      style={{ 
        width: `${current.w}px`, 
        height: `${current.w * 1.44}px`,
        perspective: "1200px" // 👈 Efecto de profundidad 3D
      }}
    >
      <motion.div 
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.7, type: "spring", stiffness: 200, damping: 20 }}
          style={{ 
            width: '350px', 
            height: '505px', 
            transformOrigin: 'top left',
            transformStyle: "preserve-3d", // 👈 Mantiene las caras en 3D
            scale: current.s
          }}
          className="relative w-full h-full"
      >
        
        {/* --- CARA FRONT (BRONCE) --- */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl"
          style={{ 
            backfaceVisibility: "hidden", // 👈 Oculta esta cara al girar
            WebkitBackfaceVisibility: "hidden" 
          }}
        >
          <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-30" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
          <img src="/bronce.png" alt="Card Bronze" className="w-[350px] h-auto relative z-10 select-none pointer-events-none" />
          
          {player.photo_url && (
            <div className="absolute top-[12px] left-[112px] w-[240px] h-[280px] z-[15] pointer-events-none"
              style={{
                backgroundImage: `url(${player.photo_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center 10%', backgroundRepeat: 'no-repeat',
                WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
                maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 80%)',
                filter: 'brightness(1.05) contrast(1.05)',
              }}
            />
          )}

          <div className="absolute top-[55px] left-[43px] z-20 flex flex-col items-center gap-0 text-amber-950">
            <div className="text-[92px] font-bold leading-[0.7] tracking-[-0.06em]" style={{ transform: "scaleX(0.85)" }}>{rating}</div>
            <div className="text-[28px] font-bold uppercase tracking-[-0.02em] mt-1" style={{ transform: "scaleX(0.9)" }}>{player.position || 'DEL'}</div>
            <div className="h-[2px] w-12 bg-amber-950/20 my-2" /> 
            <img src={`https://flagcdn.com/w80/${player.country_code || 'es'}.png`} className="w-10 h-auto shadow-sm" alt="Flag" />
            <img src={player.team_logo || "/logo_club.png"} className="w-12 h-12 object-contain mt-1" alt="Club" />
          </div>

          <div className="absolute top-[282px] left-0 w-full text-center z-30 px-2 pointer-events-none">
            <span className="text-amber-950 text-[38px] font-bold uppercase italic tracking-[-0.04em] leading-none" style={{ display: 'inline-block', transform: "scaleX(0.88)" }}>
              {player.name}
            </span>
          </div>

          <div className="absolute top-[345px] left-0 w-full flex justify-center items-center z-20 px-10 text-amber-950">
            {/* ... stats simplificadas para brevedad ... */}
            <div className="flex flex-col text-right pr-6 gap-0">
              <div className="flex items-center gap-2 font-bold"><span className="text-3xl">{player.pac || 65}</span><span className="text-xl opacity-70">RIT</span></div>
              <div className="flex items-center gap-2 font-bold"><span className="text-3xl">{player.sho || 60}</span><span className="text-xl opacity-70">TIR</span></div>
            </div>
            <div className="w-[1.5px] h-20 bg-amber-950/20 mx-1" />
            <div className="flex flex-col text-left pl-6 gap-0">
              <div className="flex items-center gap-2 font-bold"><span className="text-xl opacity-70">REG</span><span className="text-3xl">{player.dri || 62}</span></div>
              <div className="flex items-center gap-2 font-bold"><span className="text-xl opacity-70">DEF</span><span className="text-3xl">{player.def || 45}</span></div>
            </div>
          </div>
        </div>

        {/* --- CARA BACK (BLANCA / EDICIÓN) --- */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[45px] overflow-hidden shadow-2xl bg-white"
          style={{ 
            backfaceVisibility: "hidden", 
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)", // 👈 Posicionada al revés
            backgroundImage: "url('/bronce_back.webp')", // Tu tarjeta blanca
            backgroundSize: 'cover'
          }}
        >
          {/* Aquí inyectamos el formulario desde PlayerHome */}
          <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8">
            {children}
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default FutCard;