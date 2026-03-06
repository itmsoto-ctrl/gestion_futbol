import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CalendarModal = ({ matches = [], onClose }) => {
    
    const getMatchDetails = (match) => {
        const dateVal = match.date || match.match_date;
        const timeVal = match.time || match.match_time;
        
        let dateText = "S/D";
        let timeText = "--:--";

        if (dateVal) {
            try {
                const cleanDate = String(dateVal).substring(0, 10); 
                const [year, month, day] = cleanDate.split('-').map(Number);
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const d = new Date(year, month - 1, day);
                    dateText = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
                }
            } catch (e) { dateText = "Error"; }
        }
        
        if (timeVal) timeText = String(timeVal).substring(0, 5);
        return { dateText, timeText };
    };

    // 🛡️ SALVAVIDAS: Si matches no es una lista válida, usamos una lista vacía para no explotar
    const safeMatches = Array.isArray(matches) ? matches : [];

    return (
        <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-[100] bg-zinc-950 p-6 pt-16 overflow-y-auto"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 active:scale-90 p-2">
                <X size={32}/>
            </button>

            <h2 className="text-4xl font-black italic text-white uppercase mb-8 tracking-tighter">
                Calendario <span className="text-lime-400">Nex</span>
            </h2>

            {safeMatches.length === 0 ? (
                <div className="text-center text-white/50 italic mt-20">No hay partidos programados.</div>
            ) : (
                <div className="space-y-4 pb-24">
                    {safeMatches.map((m, i) => {
                        const { dateText, timeText } = getMatchDetails(m);
                        
                        // Adaptamos los nombres a la DB actual
                        const hGoals = m.score_home ?? m.home_team_goals;
                        const aGoals = m.score_away ?? m.away_team_goals;
                        
                        return (
                            <div key={i} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2.2rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
                                <span className="absolute -left-1 -top-1 text-3xl font-black text-white/[0.02] italic select-none">
                                    J{i+1}
                                </span>

                                <div className="flex-1 text-left relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-sm font-black uppercase text-lime-400 italic tracking-widest">{dateText}</span>
                                        <span className="text-[10px] font-black bg-lime-400 text-black px-2.5 py-0.5 rounded-md shadow-[0_0_15px_rgba(163,230,53,0.3)]">{timeText}H</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <span className={`font-black uppercase text-lg italic leading-none tracking-tight ${hGoals > aGoals ? 'text-lime-400' : 'text-white'}`}>{m.home_team}</span>
                                        <span className={`font-black uppercase text-lg italic leading-none tracking-tight ${aGoals > hGoals ? 'text-lime-400' : 'text-white'}`}>{m.away_team}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end justify-center gap-1.5 border-l border-white/10 pl-6 ml-4">
                                    <span className={`font-black italic text-2xl leading-none ${hGoals > aGoals ? 'text-lime-400' : 'text-white/40'}`}>{hGoals ?? '-'}</span>
                                    <span className={`font-black italic text-2xl leading-none ${aGoals > hGoals ? 'text-lime-400' : 'text-white/40'}`}>{aGoals ?? '-'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default CalendarModal;