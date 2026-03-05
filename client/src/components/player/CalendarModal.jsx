import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CalendarModal = ({ matches, onClose }) => {
    
    // 🕒 Función movida aquí para no ensuciar el PlayerHome
    const formatMatchDateTime = (match) => {
        let text = "";
        const dateVal = match.date || match.match_date;
        if (dateVal) {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                text += ` • ${d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })}`;
            } else {
                text += ` • ${dateVal}`;
            }
        }
        
        const timeVal = match.time || match.match_time;
        if (timeVal) {
            text += ` • ${timeVal.substring(0, 5)}`; 
        }
        return text;
    };

    return (
        <motion.div 
            initial={{y:'100%'}} 
            animate={{y:0}} 
            exit={{y:'100%'}} 
            transition={{type: 'spring', damping: 25, stiffness: 200}} 
            className="absolute inset-0 z-[100] bg-zinc-950 p-6 pt-16 overflow-y-auto ml-16 sm:ml-20"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 active:scale-90">
                <X size={32}/>
            </button>
            <h2 className="text-3xl font-black italic text-lime-400 uppercase mb-6 tracking-tighter">Calendario</h2>
            <div className="space-y-3 pb-10">
                {matches.map((m, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                        <div className="flex-1 text-left">
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">
                                Jornada {i+1}{formatMatchDateTime(m)}
                            </p>
                            <div className="flex flex-col gap-1">
                                <span className={`font-bold uppercase text-sm ${m.home_team_goals > m.away_team_goals ? 'text-lime-400' : 'text-white'}`}>{m.home_team}</span>
                                <span className={`font-bold uppercase text-sm ${m.away_team_goals > m.home_team_goals ? 'text-lime-400' : 'text-white'}`}>{m.away_team}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1 border-l border-white/10 pl-4 ml-4">
                            <span className="text-lime-400 font-black italic text-lg leading-none">{m.home_team_goals ?? '-'}</span>
                            <span className="text-lime-400 font-black italic text-lg leading-none">{m.away_team_goals ?? '-'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default CalendarModal;