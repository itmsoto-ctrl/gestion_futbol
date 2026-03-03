import React, { useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const FutCard = ({ player, size = "large" }) => {
  const videoRef = useRef(null);
  
  // --- LÓGICA 3D TILT ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Creamos un efecto de "muelle" para que el movimiento sea fluido y no brusco
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  // Transformamos la posición del toque en grados de rotación
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  useEffect(() => { 
    if (videoRef.current) videoRef.current.play().catch(() => {}); 
  }, [player?.photo_url]);

  if (!player) return null;
  const rating = parseInt(player.rating) || 85;
  const scales = { small: "scale-[0.4] -m-24", medium: "scale-[0.7] -m-10", large: "scale-100" };

  return (
    <div 
        className="perspective-1000" 
        style={{ perspective: "1200px" }} // Creamos el espacio 3D
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
    >
      <motion.div 
          // Animación de entrada y vinculación de los valores 3D
          initial={{ scale: 0.5, opacity: 0, rotateY: -30, rotateX: 20 }}
          animate={{ scale: 1, opacity: 1, rotateY: 0, rotateX: 0 }}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d", // Obligatorio para que los hijos hereden el 3D
          }}
          transition={{ duration: 1, ease: "backOut" }}
          className={`relative inline-block ${scales[size]} rounded-[50px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700`}
      >
        {/* Capa de Brillo Reactivo al 3D (Z-Index alto para que flote) */}
        <motion.div 
            style={{
                transform: "translateZ(50px)", // El brillo flota por encima de la carta
            }}
            className="absolute inset-0 z-30 pointer-events-none bg-gradient-to-tr from-white/10 via-white/5 to-transparent opacity-50"
        />

        {/* 1. Fondo de vídeo */}
        <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
        
        {/* 2. Destello animado estándar */}
        <motion.div animate={{ x: [-500, 500] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute inset-0 z-[5] bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 -skew-x-12 pointer-events-none" />
        
        <img src="/oro.png" alt="Card" className="w-[350px] h-auto relative z-10 select-none pointer-events-none" />
        
        {/* 📸 FOTO SUBIDA Y A LA DERECHA */}
        {player.photo_url && (
          <div 
            className="absolute top-[15px] left-[110px] w-[260px] h-[300px] z-[15] pointer-events-none"
            style={{
              backgroundImage: `url(${player.photo_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 10%', 
              backgroundRepeat: 'no-repeat',
              WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)',
              maskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)',
              filter: 'brightness(1.08) contrast(1.05)',
              transform: "translateZ(30px)", // La foto flota un poco por encima del cartón
            }}
          />
        )}

        {/* TEXTOS Y STATS CON PROFUNDIDAD */}
        <div style={{ transform: "translateZ(40px)" }} className="absolute top-[68px] left-[60px] z-20 text-zinc-800 text-7xl font-black italic tracking-tighter">{rating}</div>
        <div style={{ transform: "translateZ(35px)" }} className="absolute top-[140px] left-[80px] z-20 text-zinc-800 text-2xl font-bold uppercase">{player.position || 'DEL'}</div>
        <div style={{ transform: "translateZ(40px)" }} className="absolute top-[285px] left-0 w-full text-center z-20 px-4"><span className="text-zinc-900 text-3xl font-black uppercase italic truncate block">{player.name}</span></div>
        
        <div style={{ transform: "translateZ(35px)" }} className="absolute top-[340px] left-[58px] z-20 text-left leading-[35px]">
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pac || 80}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">RIT</span></div>
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.sho || 85}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">TIR</span></div>
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.pas || 72}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">PAS</span></div>
        </div>
        
        <div style={{ transform: "translateZ(35px)" }} className="absolute top-[340px] left-[192px] z-20 text-left leading-[35px]">
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.dri || 84}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">REG</span></div>
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.def || 35}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">DEF</span></div>
          <div className="flex items-center gap-5"><span className="text-zinc-800 font-black text-3xl w-7">{player.phy || 70}</span><span className="text-zinc-700 font-bold text-[22px] uppercase opacity-70">FIS</span></div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;