import React, { useRef, useEffect, useState, memo } from 'react';
import { motion, animate } from 'framer-motion';

// ✅ COMPONENTE RECUPERADO: Contador animado para la media
const RatingCounter = memo(({ targetValue }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Usamos sessionStorage para que solo se anime una vez por sesión
    const sessionKey = `vora_rating_animated_${targetValue}`;
    if (sessionStorage.getItem(sessionKey) || targetValue === 0) {
      setDisplayValue(targetValue);
      return;
    }

    if (!hasAnimated.current && targetValue > 0) {
      const controls = animate(0, targetValue, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (value) => setDisplayValue(Math.round(value)),
        onComplete: () => {
          hasAnimated.current = true;
          sessionStorage.setItem(sessionKey, 'true');
        }
      });
      return () => controls.stop();
    }
  }, [targetValue]);

  return <span>{displayValue}</span>;
});

const FutCard = ({ player, isFlipped, onFlip, size = "large" }) => {
  const stats = player?.stats || { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };
  const rating = player?.rating || 60; // Valor por defecto si no hay rating
  
  // Definición de tamaños (manteniendo la proporción de carta de FUT)
  const sizes = {
    small: { w: 180, h: 260, title: 'text-xl', stats: 'text-xs', rating: 'text-3xl' },
    medium: { w: 240, h: 340, title: 'text-2xl', stats: 'text-sm', rating: 'text-5xl' },
    large: { w: 320, h: 460, title: 'text-[32px]', stats: 'text-[22px]', rating: 'text-[70px]' }
  };
  const current = sizes[size] || sizes.large;

  // Color del texto (un marrón oscuro dorado típico de las cartas)
  const textColor = "text-[#5e4c35]";

  return (
    <div 
      className="relative perspective-1000 cursor-pointer select-none font-oswald font-bold"
      style={{ width: current.w, height: current.h }}
      onClick={onFlip}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* --- CARA FRONTAL --- */}
        <div className="absolute inset-0 backface-hidden rounded-[15%] overflow-hidden shadow-2xl"
             style={{ 
               backgroundImage: "url('/bronce.png')", 
               backgroundSize: '100% 100%',
               boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
             }}>
          
          {/* FOTO DEL JUGADOR (Con máscara de recorte en la base) */}
          {player?.photo_url && (
            <div 
              className="absolute top-[15%] left-[25%] w-[70%] h-[60%] bg-cover bg-top z-0 pointer-events-none contrast-[1.1] saturate-[1.1]"
              style={{ 
                backgroundImage: `url(${player.photo_url})`,
                maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
              }}
            />
          )}

          {/* BLOQUE SUPERIOR IZQUIERDO (Rating, Posición, Banderas) */}
          <div className={`absolute top-[12%] left-[10%] flex flex-col items-center leading-none z-10 ${textColor}`}>
            {/* ✅ Rating Animado */}
            <div className={current.rating}>
                <RatingCounter targetValue={rating} />
            </div>
            <div className="text-2xl uppercase tracking-tighter">{player?.position || 'MCO'}</div>
            
            <div className="flex flex-col gap-2 mt-3 items-center">
                {/* Bandera País */}
                <img 
                  src={`https://flagcdn.com/w40/${player?.country_code || 'es'}.png`} 
                  alt="country" 
                  className="w-8 shadow-sm border border-[#5e4c35]/20"
                />
                {/* Escudo Equipo */}
                {player?.team_logo && (
                  <img src={player?.team_logo} alt="team" className="w-9 h-9 object-contain filter drop-shadow-sm" />
                )}
            </div>
          </div>

          {/* NOMBRE JUGADOR Y LÍNEA SEPARADORA */}
          <div className={`absolute top-[62%] w-full text-center z-20 ${textColor}`}>
              <div className={`${current.title} uppercase tracking-tight truncate px-4`}>
                {player?.name || 'JUGADOR VORA'}
              </div>
              {/* Línea separadora */}
              <div className="w-[85%] h-[2px] bg-[#5e4c35]/30 mx-auto mt-1"></div>
          </div>

          {/* BLOQUE DE ESTADÍSTICAS (Rejilla con separador vertical) */}
          <div className={`absolute bottom-[10%] w-full flex justify-center items-center z-20 ${textColor} leading-tight`}>
            
            {/* Columna Izquierda */}
            <div className={`flex flex-col text-right pr-4 border-r-2 border-[#5e4c35]/30 ${current.stats}`}>
              <div><span className="font-black mr-1">{stats.pac}</span><span className="font-medium opacity-80">PAC</span></div>
              <div><span className="font-black mr-1">{stats.sho}</span><span className="font-medium opacity-80">SHO</span></div>
              <div><span className="font-black mr-1">{stats.pas}</span><span className="font-medium opacity-80">PAS</span></div>
            </div>

            {/* Columna Derecha */}
            <div className={`flex flex-col text-left pl-4 ${current.stats}`}>
              <div><span className="font-black mr-1">{stats.dri}</span><span className="font-medium opacity-80">DRI</span></div>
              <div><span className="font-black mr-1">{stats.def}</span><span className="font-medium opacity-80">DEF</span></div>
              <div><span className="font-black mr-1">{stats.phy}</span><span className="font-medium opacity-80">PHY</span></div>
            </div>

          </div>

        </div>

        {/* --- CARA TRASERA (Reverso) --- */}
        <div className="absolute inset-0 backface-hidden rounded-[15%] overflow-hidden shadow-2xl"
             style={{ 
               backgroundImage: "url('/bronce.png')",
               backgroundSize: '100% 100%', 
               transform: "rotateY(180deg)" 
             }}>
             <div className="flex items-center justify-center h-full bg-black/50">
                <img src="/logo-vora.png" alt="Vora" className="w-1/2 opacity-50" />
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FutCard;