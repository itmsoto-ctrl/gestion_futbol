import React, { useState, useEffect } from 'react';
import { Home, Calendar, Trophy, BarChart2, Settings, UploadCloud } from 'lucide-react';
import FutCard from '../FutCard'; 
import MatchSlider from '../player/MatchSlider';
import useInteractionSounds from '../../hooks/useInteractionSounds';

const PlayerHome = () => {
    const { playClick, playSwipe, playOpen } = useInteractionSounds();
    const [user, setUser] = useState(null); // ... lógica de fetch aquí ...

    // 🔊 ACTIVADOR DE AUDIO Y VIBRACIÓN
    const handleAction = (type, fn) => {
        // Vibración háptica (20ms)
        if (window.navigator.vibrate) window.navigator.vibrate(20);
        
        // Sonidos
        if (type === 'click') playClick();
        if (type === 'swipe') playSwipe();
        if (type === 'open') playOpen();
        
        if (fn) fn();
    };

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden" 
             style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* SIDEBAR CON SOMBRA BLANCA DIFUMINADA */}
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 space-y-6 z-50">
                <button onClick={() => handleAction('click')} className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]"><Home size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all"><Calendar size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all"><Trophy size={24} /></button>
                <button onClick={() => handleAction('open')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto"><Settings size={24} /></button>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 pt-6 pb-6 overflow-y-auto">
                
                {/* 🃏 CROMO: Escala ajustada y Balanceo Axial */}
                <div 
                    onClick={() => handleAction('open', () => setView('SELFIE'))} 
                    className="cursor-pointer transform scale-[0.68] sm:scale-80 transition-all drop-shadow-[0_30px_45px_rgba(0,0,0,0.8)] mt-[-75px]"
                >
                    <FutCard player={user} />
                    <div className="absolute -bottom-10 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse italic">Toca para gestionar ficha</p>
                    </div>
                </div>

                {/* ⚽ SLIDER: Con sonido al deslizar */}
                <div onTouchStart={() => handleAction('swipe')} className="w-full flex justify-center mt-4">
                    <MatchSlider matches={[]} />
                </div>
                
            </main>
        </div>
    );
};

export default PlayerHome;