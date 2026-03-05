import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Crown, ChevronRight } from 'lucide-react';

const InfoCenter = ({ matches, onMatchClick }) => {
  const [index, setIndex] = useState(0);
  
  const slides = [
    {
      id: 'match',
      content: (
        <div onClick={onMatchClick} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-3xl flex items-center justify-between shadow-xl cursor-pointer active:scale-95 transition-all">
          <div>
            <p className="text-[10px] font-black text-amber-400 italic">PRÓXIMA JORNADA</p>
            <h3 className="text-white font-bold text-lg uppercase leading-tight">{matches[0]?.home_team || 'POR DEFINIR'} vs {matches[0]?.away_team || '???'}</h3>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Toca para ver detalles</p>
          </div>
          <div className="bg-amber-400 p-2 rounded-xl text-black"><ChevronRight size={20}/></div>
        </div>
      )
    },
    {
      id: 'potw',
      content: (
        <div className="bg-gradient-to-r from-amber-400/20 to-transparent backdrop-blur-md border border-amber-400/20 p-4 rounded-3xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-400/20"><Star fill="currentColor" size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Jugador de la Semana</p>
            <h3 className="text-white font-black italic text-xl uppercase tracking-tighter">URIEL BOTAS</h3>
          </div>
        </div>
      )
    },
    {
      id: 'premium',
      content: (
        <div className="bg-lime-400 p-4 rounded-3xl flex items-center justify-between shadow-[0_0_30px_rgba(163,230,53,0.3)] cursor-pointer">
          <div>
            <p className="text-black font-black italic text-xl uppercase tracking-tighter">EXPERIENCIA PREMIUM</p>
            <p className="text-black/60 text-[10px] font-bold uppercase">Pulsa para saber más</p>
          </div>
          <Crown className="text-black" size={32} />
        </div>
      )
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full max-w-sm h-28 relative mt-[-20px] z-10 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {slides[index].content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default InfoCenter;