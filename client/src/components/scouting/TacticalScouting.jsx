import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FutCard from '../FutCard';

const POSITIONS = {
  DC:  { top: '15%', left: '50%' },
  EI:  { top: '22%', left: '20%' },
  ED:  { top: '22%', left: '80%' },
  MCO: { top: '38%', left: '50%' },
  MC:  { top: '55%', left: '50%' },
  DFC: { top: '80%', left: '50%' },
  POR: { top: '92%', left: '50%' },
};

// 👇 AQUÍ ESTABA EL ERROR: Faltaba recibir onToggleExpand en los props
const TacticalScouting = ({ rivals = [], onToggleExpand }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const groupedRivals = rivals.reduce((acc, player) => {
    const pos = player.position || 'MC';
    if (!acc[pos]) acc[pos] = [];
    acc[pos].push(player);
    return acc;
  }, {});

  return (
    <div className="relative w-full h-full bg-black/40 overflow-hidden flex items-center justify-center">
      <img src="/campo.jpeg" className="w-full h-full object-cover opacity-80" alt="campo" />

      {Object.entries(groupedRivals).map(([pos, players]) => {
        const coords = POSITIONS[pos] || POSITIONS.MC;
        return (
          <div 
            key={pos}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ top: coords.top, left: coords.left }}
          >
            <div className="flex -space-x-4">
              {players.map((p) => (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setSelectedPlayer(p);
                    // Avisamos al padre (PlayerHome) que oculte la X principal
                    if (onToggleExpand) onToggleExpand(true); 
                  }}
                  className="w-12 h-12 rounded-full border-2 border-lime-400 bg-zinc-900 cursor-pointer shadow-lg flex items-center justify-center overflow-hidden relative"
                >
                    {/* 👤 Foto del jugador muy sutil de fondo */}
                    {p.photo_url && (
                        <img src={p.photo_url} className="absolute inset-0 w-full h-full object-cover opacity-30" alt={p.name} />
                    )}
                    {/* ⭐ Rating destacado en el centro */}
                    <span className="relative z-10 text-white font-black text-lg italic drop-shadow-md">
                        {p.rating || 60}
                    </span>
                </motion.div>
              ))}
            </div>
            <span className="text-[10px] text-white font-black bg-black/50 px-2 rounded-full mt-1 block text-center uppercase tracking-tighter">
              {pos}
            </span>
          </div>
        );
      })}

      <AnimatePresence>
        {selectedPlayer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4"
            // ✅ Cerramos al pulsar el fondo y reactivamos la X
            onClick={() => {
                setSelectedPlayer(null);
                if (onToggleExpand) onToggleExpand(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }} 
              animate={{ scale: 1, y: 0 }}
              // ❌ Evitamos que el click en la carta cierre el modal
              onClick={(e) => e.stopPropagation()}
            >
              <FutCard player={selectedPlayer} showVideo={true} showAnim={true} />
            </motion.div>
            
            <button 
              onClick={() => {
                  setSelectedPlayer(null);
                  if (onToggleExpand) onToggleExpand(false); // Reactivamos la X principal
              }}
              className="mt-8 bg-lime-400 px-8 py-3 rounded-full text-black font-black uppercase italic text-xs tracking-widest shadow-lg active:scale-95 transition-all"
            >
              VOLVER A LA PIZARRA
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TacticalScouting;