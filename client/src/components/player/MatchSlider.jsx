import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Lógica para el arrastre (Swipe)
    const handleDragEnd = (event, info) => {
        const threshold = 50;
        if (info.offset.x < -threshold && currentIndex < matches.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (info.offset.x > threshold && currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const currentMatch = matches[currentIndex];
    const matchDate = new Date(currentMatch.match_date);
    const day = matchDate.getDate();
    const month = matchDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');

    return (
        <div className="w-full max-w-md px-2 mt-[-20px] select-none relative z-10">
            {/* BADGE DE JORNADA MEJORADO */}
            <div className="flex justify-center mb-4">
                <div className="px-6 py-1.5 bg-gradient-to-r from-amber-500 to-amber-300 text-black text-[12px] font-black uppercase italic rounded-full tracking-[0.2em] shadow-[0_0_20px_rgba(251,191,36,0.5)]">
                    {currentMatch.type || `JORNADA ${currentMatch.round || '?'}`}
                </div>
            </div>

            {/* CONTENEDOR TÁCTIL (Drag) */}
            <div className="relative h-72 touch-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={handleDragEnd}
                        initial={{ opacity: 0, scale: 0.9, x: 100 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -100 }}
                        className="w-full h-full bg-gradient-to-b from-zinc-900/90 to-black/95 backdrop-blur-2xl border-2 border-white/10 rounded-[3rem] p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] flex flex-col justify-between overflow-hidden"
                    >
                        {/* EFECTO DE LUZ DE FONDO */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-amber-400/50 blur-xl"></div>

                        <div className="flex justify-between items-center pt-2">
                            {/* LOCAL */}
                            <div className="flex flex-col items-center gap-3 flex-1">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center p-3 border border-white/10 shadow-inner">
                                    <img src={currentMatch.home_logo || '/default-team.png'} className="w-full h-full object-contain" alt="L" />
                                </div>
                                <span className="text-[14px] font-black uppercase italic text-white text-center leading-tight tracking-tighter">
                                    {currentMatch.home_team}
                                </span>
                            </div>

                            {/* VS Y FECHA TIPO CALENDARIO */}
                            <div className="flex flex-col items-center gap-4 px-2">
                                <span className="text-amber-400 font-black italic text-3xl drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">VS</span>
                                
                                {/* 📅 CALENDARIO VISUAL */}
                                <div className="flex flex-col items-center bg-white rounded-xl overflow-hidden shadow-lg w-14">
                                    <span className="text-black font-black text-xl py-1 leading-none">{day}</span>
                                    <span className="bg-red-600 text-white text-[10px] font-black w-full text-center py-0.5">{month}</span>
                                </div>
                            </div>

                            {/* VISITANTE */}
                            <div className="flex flex-col items-center gap-3 flex-1">
                                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center p-3 border border-white/10 shadow-inner">
                                    <img src={currentMatch.away_logo || '/default-team.png'} className="w-full h-full object-contain" alt="V" />
                                </div>
                                <span className="text-[14px] font-black uppercase italic text-white text-center leading-tight tracking-tighter">
                                    {currentMatch.away_team}
                                </span>
                            </div>
                        </div>

                        {/* INFO SEDE Y HORA - MÁS GRANDE */}
                        <div className="border-t border-white/10 mt-6 pt-4 text-center">
                            <div className="flex justify-center items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                <p className="text-lg font-black text-white uppercase tracking-[0.1em]">
                                    {currentMatch.match_time?.slice(0, 5)}H
                                </p>
                            </div>
                            <p className="text-[11px] font-bold text-amber-400/80 uppercase tracking-[0.2em]">
                                {currentMatch.venue_name || 'ESTADIO VORA'}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* INDICADORES (PUNTITOS) */}
            <div className="flex justify-center gap-2 mt-6">
                {matches.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-10 bg-amber-400' : 'w-2 bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
};

export default MatchSlider;