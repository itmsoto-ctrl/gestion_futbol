// 📄 src/components/portal/PlayerSidebar.jsx
import React from 'react';
import { Home, Calendar, Trophy, Users, BarChart2, Settings, UploadCloud } from 'lucide-react';

const PlayerSidebar = ({ modalView, setModalView, showInstallBtn, handleInstallClick, playClick, setShowTutorial }) => {
    return (
        <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 sm:py-12 space-y-6 sm:space-y-8 z-50">
            <button onClick={() => { playClick(); setModalView(null); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${!modalView ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Home size={24} /></button>
            <button onClick={() => { playClick(); setModalView('CALENDAR'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'CALENDAR' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Calendar size={24} /></button>
            <button onClick={() => { playClick(); setModalView('STANDINGS'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'STANDINGS' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Trophy size={24} /></button>
            <button onClick={() => { playClick(); setModalView('ROSTER'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'ROSTER' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Users size={24} /></button>
            
            {showInstallBtn ? (
                <button onClick={() => { playClick(); handleInstallClick(); }} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] animate-pulse"><UploadCloud size={24} /></button>
            ) : (
                <button onClick={playClick} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white transition-all"><BarChart2 size={24} /></button>
            )}
            
            <button onClick={() => { playClick(); setShowTutorial(true); }} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto hover:text-white transition-all"><Settings size={24} /></button>
        </aside>
    );
};

export default PlayerSidebar;