import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const FutCard = ({ player, size = "large" }) => {
  const videoRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  useEffect(() => { if (videoRef.current) videoRef.current.play().catch(() => {}); }, []);

  const rating = parseInt(player.rating) || 85;
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <div className="perspective-1000" style={{ perspective: "1200px" }} onMouseMove={handleMouseMove} onMouseLeave={() => { x.set(0); y.set(0); }}>
      <motion.div 
          style={{ rotateX, rotateY, transformStyle: "preserve-3d", fontFamily: "'Oswald', sans-serif" }}
          transition={{ duration: 0.5 }}
          className={`relative inline-block ${scales[size]} rounded-[45px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)]`}
      >
        {/* FONDO Y VÍDEO */}
        <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
        <img src="/oro.png" alt="Card" className="w-[350px] h-auto relative z-10 select-none" />
        
        {/* 📸 FOTO JUGADOR (Posicionada como en tu captura de Jose Palomino) */}
        {player.photo_url && (
          <div className="absolute top-[25px] left-[100px] w-[260px] h-[280px] z-[15] pointer-events-none"
            style={{
              backgroundImage: `url(${player.photo_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center 15%', backgroundRepeat: 'no-repeat',
              WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 85%)',
              transform: "translateZ(40px)"
            }}
          />
        )}

        {/* 🏆 COLUMNA IZQUIERDA: RATING Y POSICIÓN */}
<div className="absolute top-[55px] left-[43px] z-20 flex flex-col items-center gap-0 text-zinc-800" style={{ transform: "translateZ(50px)" }}>
  {/* El Rating: Forzamos que sea más estrecho con scaleX */}
  <div className="text-[92px] font-bold leading-[0.7] tracking-[-0.06em]" 
       style={{ transform: "scaleX(0.85)", transformOrigin: "center" }}>
    {rating}
  </div>
  {/* La Posición: Un poco más pequeña para que no se pegue */}
  <div className="text-[28px] font-bold uppercase tracking-[-0.02em] mt-1" 
       style={{ transform: "scaleX(0.9)" }}>
    {player.position || 'DEL'}
  </div>
  
  <div className="h-[2px] w-12 bg-zinc-800/30 my-2" /> 
  <img src="https://flagcdn.com/w80/es.png" className="w-10 h-auto shadow-sm" alt="Flag" />
  <img src="/logo_club.png" className="w-12 h-12 object-contain mt-1" alt="Club" />
</div>

{/* 👤 NOMBRE: Estilo FIFA real */}
<div style={{ transform: "translateZ(60px)" }} className="absolute top-[278px] left-0 w-full text-center z-30 px-2">
  <span className="text-zinc-900 text-[40px] font-bold uppercase italic tracking-[-0.04em] leading-none"
        style={{ 
            display: 'inline-block', 
            transform: "scaleX(0.88)", 
            textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.1)' 
        }}>
    {player.name}
  </span>
</div>

        {/* 📊 STATS CON LÍNEA DIVISORIA CENTRAL */}
        <div className="absolute top-[345px] left-0 w-full flex justify-center items-center z-20 px-10" style={{ transform: "translateZ(45px)" }}>
          
          {/* Bloque Izquierdo */}
          <div className="flex flex-col gap-0 text-right pr-6">
            <div className="flex items-center gap-2"><span className="text-zinc-800 font-bold text-3xl">{player.pac || 80}</span><span className="text-zinc-700 font-medium text-xl opacity-70">RIT</span></div>
            <div className="flex items-center gap-2"><span className="text-zinc-800 font-bold text-3xl">{player.sho || 85}</span><span className="text-zinc-700 font-medium text-xl opacity-70">TIR</span></div>
            <div className="flex items-center gap-2"><span className="text-zinc-800 font-bold text-3xl">{player.pas || 72}</span><span className="text-zinc-700 font-medium text-xl opacity-70">PAS</span></div>
          </div>

          {/* 📏 LA LÍNEA VERTICAL DEL FIFA */}
          <div className="w-[2px] h-24 bg-zinc-800/20" />

          {/* Bloque Derecho */}
          <div className="flex flex-col gap-0 text-left pl-6">
            <div className="flex items-center gap-2"><span className="text-zinc-700 font-medium text-xl opacity-70">REG</span><span className="text-zinc-800 font-bold text-3xl">{player.dri || 84}</span></div>
            <div className="flex items-center gap-2"><span className="text-zinc-700 font-medium text-xl opacity-70">DEF</span><span className="text-zinc-800 font-bold text-3xl">{player.def || 35}</span></div>
            <div className="flex items-center gap-2"><span className="text-zinc-700 font-medium text-xl opacity-70">FIS</span><span className="text-zinc-800 font-bold text-3xl">{player.phy || 70}</span></div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;