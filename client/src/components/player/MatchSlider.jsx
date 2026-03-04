import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Importamos iconos

const MatchSlider = ({ matches }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (matches && matches.length > 0) {
            const today = new Date();
            const closestIndex = matches.findIndex(m => new Date(m.match_date) >= today);
            setCurrentIndex(closestIndex !== -1 ? closestIndex : 0);
        }
    }, [matches]);

    if (!matches || matches.length === 0) return null;

    const nextMatch = () => {
        if (currentIndex < matches.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevMatch = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const currentMatch = matches[currentIndex];

    return (
        <div className="w-full max-w-sm px-2 mt-2 sm:mt-4 select-none relative">
            {/* ETIQUETA DE JORNADA */}
            <div className="flex justify-center mb-3">
                <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em] shadow-lg z-10">
                    {currentMatch.type || `JORNADA ${currentMatch.round}`}
                </div>
            </div>

            {/* CONTENEDOR DEL SLIDER CON FLECHAS */}
            <div className="relative h-60 flex items-center">
                
                {/* Flecha Izquierda */}
                {currentIndex > 0 && (
                    <button onClick={prevMatch} className="absolute -left-2 z-30 text-white/20 hover:text-amber-400 transition-colors">
                        <ChevronLeft size={30} />
                    </button>
                )}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl h-full flex flex-col justify-between"
                    >
                        <div className="flex justify-around items-center pt-2">
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center p-2 border border-white/10">
                                    <img src={currentMatch.home_logo || '/default-team.png'} className="w-full h-full object-contain" alt="L" />
                                </div>
                                <span className="text-[9px] font-black uppercase italic text-white text-center leading-tight h-8 flex items-center justify-center">{currentMatch.home_team}</span>
                            </div>

                            <div className="flex flex-col items-center px-2">
                                <span className="text-amber-400 font-black italic text-xl">VS</span>
                            </div>

                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center p-2 border border-white/10">
                                    <img src={currentMatch.away_logo || '/default-team.png'} className="w-full h-full object-contain" alt="V" />
                                </div>
                                <span className="text-[9px] font-black uppercase italic text-white text-center leading-tight h-8 flex items-center justify-center">{currentMatch.away_team}</span>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 text-center">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                                {currentMatch.match_time?.slice(0, 5)}H — {currentMatch.venue_name || 'VORA ARENA'}
                            </p>
                            <p className="text-[9px] font-bold text-white/30 uppercase mt-1">
                                {new Date(currentMatch.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Flecha Derecha */}
                {currentIndex < matches.length - 1 && (
                    <button onClick={nextMatch} className="absolute -right-2 z-30 text-white/20 hover:text-amber-400 transition-colors">
                        <ChevronRight size={30} />
                    </button>
                )}
            </div>

            {/* INDICADORES (PUNTITOS) */}
            <div className="flex justify-center gap-1.5 mt-4">
                {matches.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-amber-400' : 'w-1 bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
};

export default MatchSlider;