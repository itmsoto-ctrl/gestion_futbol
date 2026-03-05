import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarModal = ({ matches, onClose }) => {
    
    // 🛠️ Función mejorada para obtener datos separados y sin error de día
    const getMatchDetails = (match) => {
        const dateVal = match.date || match.match_date;
        const timeVal = match.time || match.match_time;
        
        let dateText = "S/D";
        let timeText = "--:--";

        if (dateVal) {
            // Fix para evitar el desfase de un día
            const [year, month, day] = dateVal.split('-').map(Number);
            const d = new Date(year, month - 1, day);
            dateText = d.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' });
        }
        
        if (timeVal) {
            timeText = timeVal.substring(0, 5);
        }

        return { dateText, timeText };
    };

    return (
        <motion.div 
            initial={{y:'100%'}} 
            animate={{y:0}} 
            exit={{y:'100%'}} 
            transition={{type: 'spring', damping: 25, stiffness: 200}} 
            className="fixed inset-0 z-[100] bg-zinc-950 p-6 pt-16 overflow-y-auto"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 active:scale-90">
                <X size={32}/>
            </button>

            <h2 className="text-4xl font-black italic text-white uppercase mb-8 tracking-tighter">
                Calendario <span className="text-lime-400">Nex</span>
            </h2>

            <div className="space-y-4 pb-20">
                {matches.map((m, i) => {
                    const { dateText, timeText } = getMatchDetails(m);
                    
                    return (
                        <div key={i} className="bg-zinc-900/50 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
                            {/* Decoración de fondo para la jornada */}
                            <span className="absolute -left-2 -top-2 text-4xl font-black text-white/[0.03] italic">
                                J{i+1}
                            </span>

                            <div className="flex-1 text-left relative z-10">
                                <div className="flex items-center gap-3 mb-3">
                                    {/* 📅 FECHA RESALTADA (Línea con lime-400) */}
                                    <span className="text-sm font-black uppercase text-lime-400 italic tracking-wider">
                                        {dateText}
                                    </span>
                                    
                                    {/* 🕒 HORA RESALTADA (Badge lime-400) */}
                                    <span className="text-[10px] font-black bg-lime-400 text-black px-2 py-0.5 rounded-md shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                                        {timeText}H
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <span className={`font-black uppercase text-lg italic leading-tight ${m.home_team_goals > m.away_team_goals ? 'text-lime-400' : 'text-white'}`}>
                                        {m.home_team}
                                    </span>
                                    <span className={`font-black uppercase text-lg italic leading-tight ${m.away_team_goals > m.home_team_goals ? 'text-lime-400' : 'text-white'}`}>
                                        {m.away_team}
                                    </span>
                                </div>
                            </div>

                            {/* Marcador */}
                            <div className="flex flex-col items-end justify-center gap-1 border-l border-white/10 pl-5 ml-4">
                                <span className="text-white font-black italic text-2xl leading-none">
                                    {m.home_team_goals ?? '-'}
                                </span>
                                <span className="text-white font-black italic text-2xl leading-none">
                                    {m.away_team_goals ?? '-'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default CalendarModal;