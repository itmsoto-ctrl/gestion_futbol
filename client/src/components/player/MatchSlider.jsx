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

    const handleDragEnd = (e, info) => {
        const threshold = 50;
        if (info.offset.x < -threshold && currentIndex < matches.length - 1) setCurrentIndex(prev => prev + 1);
        else if (info.offset.x > threshold && currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const currentMatch = matches[currentIndex];
    const matchDate = new Date(currentMatch.match_date);
    const day = matchDate.getDate();
    const month = matchDate.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');

    return (
        <div className="w-full max-w-md px-4 mt-[-45px] select-none relative z-10"> {/* Subido "medio dedo" */}
            
            {/* JORNADA FLOTANTE */}
            <div className="flex justify-center mb-6">
                <span className="text-[14px] font-black uppercase italic text-amber-400 tracking-[0.3em] drop-shadow-md">
                    {currentMatch.type || `JORNADA ${currentMatch.round || '?'}`}
                </span>
            </div>

            {/* CONTENEDOR TRANSPARENTE CON SOMBRA */}
            <motion.div
                onClick={() => setShowModal(true)}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                className="relative h-64 w-full flex flex-col items-center justify-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.7)]"
            >
                <div className="flex w-full items-center justify-between px-4">
                    {/* LOCAL */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="w-24 h-24 flex items-center justify-center transform hover:scale-110 transition-transform">
                            <img src={currentMatch.home_logo || '/default-team.png'} className="w-full h-full object-contain filter drop-shadow-2xl" alt="L" />
                        </div>
                        <span className="text-lg font-black uppercase italic text-white tracking-tighter text-center leading-none">
                            {currentMatch.home_team}
                        </span>
                    </div>

                    {/* VS + CALENDARIO CENTRADO */}
                    <div className="flex flex-col items-center gap-3 px-6">
                        <span className="text-amber-400 font-black italic text-4xl drop-shadow-glow">VS</span>
                        
                        {/* 📅 ICONO CALENDARIO */}
                        <div className="flex flex-col items-center bg-white rounded-lg overflow-hidden w-16 shadow-2xl transform rotate-2">
                            <span className="text-black font-black text-2xl py-1">{day}</span>
                            <span className="bg-red-600 text-white text-[11px] font-black w-full text-center py-0.5">{month}</span>
                        </div>
                    </div>

                    {/* VISITANTE */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="w-24 h-24 flex items-center justify-center transform hover:scale-110 transition-transform">
                            <img src={currentMatch.away_logo || '/default-team.png'} className="w-full h-full object-contain filter drop-shadow-2xl" alt="V" />
                        </div>
                        <span className="text-lg font-black uppercase italic text-white tracking-tighter text-center leading-none">
                            {currentMatch.away_team}
                        </span>
                    </div>
                </div>

                {/* INFO RÁPIDA INFERIOR */}
                <div className="mt-8 flex items-center gap-3">
                    <span className="text-2xl font-black text-white italic tracking-widest">{currentMatch.match_time?.slice(0, 5)}H</span>
                    <div className="h-4 w-[2px] bg-amber-400/50 rotate-12"></div>
                    <span className="text-[12px] font-bold text-amber-400 uppercase tracking-[0.2em]">{currentMatch.venue_name || 'VORA ARENA'}</span>
                </div>
            </motion.div>

            {/* MODAL DE DETALLES */}
            <AnimatePresence>
                {showModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[3rem] p-8 relative overflow-hidden">
                            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-white/40"><X /></button>
                            
                            <h3 className="text-amber-400 font-black italic text-2xl mb-8 uppercase tracking-tighter">Detalles del Encuentro</h3>
                            
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/5 p-3 rounded-2xl text-amber-400"><CalIcon size={24}/></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Fecha y Hora</p>
                                        <p className="text-lg font-bold text-white uppercase">{new Date(currentMatch.match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} — {currentMatch.match_time?.slice(0,5)}H</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/5 p-3 rounded-2xl text-amber-400"><MapPin size={24}/></div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">Sede y Campo</p>
                                        <p className="text-lg font-bold text-white uppercase">{currentMatch.venue_name || 'ESTADIO VORA'}</p>
                                        <p className="text-sm font-bold text-amber-400/60 uppercase italic">{currentMatch.pitch_name || 'Campo por definir'}</p>
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