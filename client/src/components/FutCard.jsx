import React, { useRef, useEffect, memo } from 'react';
import RatingCounter from './common/RatingCounter';

const FutCard = ({ 
  player, 
  className = "", 
  showAnim = false, 
  showShine = true,
  showVideo = true 
}) => {
  const videoRef = useRef(null);
  const stats = player?.stats || { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
  const rating = player?.rating || 60;

  useEffect(() => { 
    if (showVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [showVideo, player?.photo_url]);

  return (
    <div 
      className={`relative select-none drop-shadow-2xl ${className}`} 
      style={{ width: '320px', height: '460px', fontFamily: "'Oswald', sans-serif", backgroundColor: 'transparent' }}
    >
      {/* 💡 Brillo opcional (Aislado para que no rompa la carta) */}
      {showShine && (
        <div className="absolute inset-0 z-40 pointer-events-none rounded-[40px] overflow-hidden">
          <div className="absolute -inset-[100%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 animate-[shine_4s_infinite]" />
        </div>
      )}

      {/* 📹 Video de partículas (Redondeado para que no asome por arriba) */}
      {showVideo && (
        <video ref={videoRef} className="absolute inset-0 z-0 w-full h-full object-cover opacity-40 rounded-[40px]" src="/particulas_oro.mp4" muted autoPlay loop playsInline />
      )}

      {/* 🖼️ MARCO PRINCIPAL */}
      <img src="/bronce.png" alt="Card Frame" className="absolute inset-0 w-full h-full object-cover z-10 drop-shadow-lg" />
      
      {/* 👤 FOTO JUGADOR */}
      {player?.photo_url && (
        <div className="absolute top-[15px] left-[100px] w-[200px] h-[240px] z-[15] pointer-events-none"
          style={{
            backgroundImage: `url(${player.photo_url})`,
            backgroundSize: 'cover', 
            backgroundPosition: 'center 10%',
            WebkitMaskImage: 'radial-gradient(circle at center, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 95%)',
          }}
        />
      )}

      {/* ⭐ RATING Y BANDERAS */}
      <div className="absolute top-[50px] left-[35px] z-20 flex flex-col items-center text-[#4a3b2c] font-bold">
        <div className="text-[75px] leading-[0.75] font-black tracking-tighter">
          <RatingCounter targetValue={rating} animateOnInit={showAnim} />
        </div>
        <div className="text-[22px] uppercase opacity-90">{player?.position || 'MCO'}</div>
        <div className="flex flex-col items-center gap-1 mt-1">
           <img src={`https://flagcdn.com/w80/${player?.country_code || 'es'}.png`} className="w-8 shadow-sm" alt="Flag" />
           <img src={player?.team_logo || '/default-team.png'} className="w-10 h-10 object-contain mt-1 contrast-125 drop-shadow-md" alt="Club" />
        </div>
      </div>

    
      {/* 👤 NOMBRE - Centrado y con aire */}
      <div className="absolute top-[270px] left-0 w-full text-center z-30 text-[#4a3b2c] font-black uppercase tracking-tighter">
        <span className="text-[30px] px-4 leading-none inline-block max-w-[90%] truncate">
          {player?.name || 'JUGADOR'}
        </span>
        <div className="w-[70%] h-[1px] bg-[#4a3b2c]/30 mx-auto mt-2"></div>
      </div>

      {/* 📊 ESTADÍSTICAS - Compactadas verticalmente para no pisar el borde */}
      <div className="absolute top-[315px] left-1/2 -translate-x-1/2 w-[70%] z-30 flex justify-center text-[#4a3b2c] leading-tight">
        
        {/* Columna Izquierda */}
        <div className="flex flex-col w-1/2 border-r-[1.5px] border-[#4a3b2c]/30 pr-3">
          <div className="flex justify-end items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.pac}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">RIT</span>
          </div>
          <div className="flex justify-end items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.sho}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">TIR</span>
          </div>
          <div className="flex justify-end items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.pas}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">PAS</span>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col w-1/2 pl-3">
          <div className="flex justify-start items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.dri}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">REG</span>
          </div>
          <div className="flex justify-start items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.def}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">DEF</span>
          </div>
          <div className="flex justify-start items-center gap-2 w-full">
            <span className="text-[22px] font-black">{stats.phy}</span> 
            <span className="text-[15px] font-normal w-[30px] text-left">FIS</span>
          </div>
        </div>
        
      </div>
      
    </div>
  );
};

export default memo(FutCard);