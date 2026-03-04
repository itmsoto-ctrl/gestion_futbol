import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Calendar as CalIcon } from 'lucide-react';

const MatchSlider = ({ matches }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (matches?.length > 0) {
            const today = new Date();
            const closestIndex = matches.findIndex(m => new Date(m.match_date) >= today);
            setCurrentIndex(closestIndex !== -1 ? closestIndex : 0);
        }
    }, [matches]);

    if (!matches || matches.length === 0) return null;

    // Deslizamiento ultrasensible
    const handleDragEnd = (e, info) => {
        const threshold = 30; 
        if (info.offset.x < -threshold && currentIndex < matches.length - 1) setCurrentIndex(prev => prev + 1);
        else if (info.offset.x > threshold && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const currentMatch = matches[currentIndex];
    const matchDate = new Date(currentMatch.match_date);
    const day = matchDate.getDate();
    const month = matchDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');

    return (
        <div className="w-full max-w-md px-2 mt-[-65px] select-none relative z-10">
            
            {/* JORNADA (FLOTANTE ARRIBA) */}
            <div className="flex justify-center mb-6">
                <span className="text-[12px] font-black uppercase italic text-amber-400 tracking-[0.4em] drop-shadow-lg">
                    {currentMatch.type || `JORNADA ${currentMatch.round || '?'}`}
                </span>
            </div>

            {/* CONTENEDOR TRANSPARENTE (SIN CAJA, SOLO SOMBRAS) */}
            <motion.div
                onClick={() => setShowModal(true)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                className="relative h-64 w-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing"
            >
                {/* FILA PRINCIPAL: CENTRADO MATEMÁTICO */}
                <div className="flex w-full items-center justify-center">
                    
                    {/* LOCAL */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                            <img src={currentMatch.home_logo || '/default-team.png'} className="w-full h-full object-contain filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.8)]" alt="L" />
                        </div>
                        <span className="text-lg sm:text-xl font-black uppercase italic text-white tracking-tighter text-center leading-none px-1">
                            {currentMatch.home_team}
                        </span>
                    </div>

                    {/* CENTRO (VS + CALENDARIO) */}
                    <div className="flex flex-col items-center justify-center gap-3 min-w-[90px]">
                        <span className="text-amber-400 font-black italic text-4xl sm:text-5xl drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">VS</span>
                        
                        {/* 📅 ICONO CALENDARIO */}
                        <div className="flex flex-col items-center bg-white rounded-lg overflow-hidden w-16 shadow-[0_15px_30px_rgba(0,0,0,0.6)] transform -rotate-1">
                            <span className="text-black font-black text-2xl py-0.5 leading-none">{day}</span>
                            <span className="bg-red-600 text-white text-[10px] font-black w-full text-center py-1 uppercase">{month}</span>
                        </div>
                    </div>

                    {/* VISITANTE */}
                    <div className="flex-1 flex flex-col items-center gap-4">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                            <img src={currentMatch.away_logo || '/default-team.png'} className="w-full h-full object-contain filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.8)]" alt="V" />
                        </div>
                        <span className="text-lg sm:text-xl font-black uppercase italic text-white tracking-tighter text-center leading-none px-1">
                            {currentMatch.away_team}
                        </span>
                    </div>
                </div>

                {/* INFO SEDE Y HORA (FLOTANTE ABAJO) */}
                <div className="mt-8 flex flex-col items-center gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-white italic tracking-[0.2em] drop-shadow-lg">
                        {currentMatch.match_time?.slice(0, 5)}H
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-[0.4em]">
                            {currentMatch.venue_name || 'VORA ARENA'}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* MODAL DE DETALLES (GLASSMORPHISM) */}
            <AnimatePresence>
                {showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-sm bg-zinc-900/50 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden shadow-2xl">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/40 p-2"><X size={28} /></button>
                            <h3 className="text-amber-400 font-black italic text-2xl mb-8 uppercase tracking-tighter">Detalles</h3>
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="bg-amber-400/10 p-3 rounded-2xl text-amber-400"><CalIcon size={24}/></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Fecha</p>
                                        <p className="text-lg font-bold text-white uppercase">{matchDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="bg-amber-400/10 p-3 rounded-2xl text-amber-400"><MapPin size={24}/></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Sede y Campo</p>
                                        <p className="text-lg font-bold text-white uppercase">{currentMatch.venue_name}</p>
                                        <p className="text-sm font-black text-amber-400 uppercase italic mt-1">{currentMatch.pitch_name || 'CAMPO PRINCIPAL'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MatchSlider;