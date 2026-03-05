import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';

const CalendarModal = ({ matches, onClose }) => {
    
    // 🛠️ Función "A prueba de balas" para procesar fechas y horas
    const getMatchDetails = (match) => {
        const dateVal = match.date || match.match_date;
        const timeVal = match.time || match.match_time;
        
        let dateText = "S/D";
        let timeText = "--:--";

        if (dateVal) {
            try {
                // 🛡️ Forzamos a string y cortamos para tener solo YYYY-MM-DD
                const cleanDate = String(dateVal).substring(0, 10); 
                const [year, month, day] = cleanDate.split('-').map(Number);
                
                // Solo si el split ha funcionado creamos la fecha
                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                    const d = new Date(year, month - 1, day);
                    dateText = d.toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short' 
                    });
                }
            } catch (e) {
                console.error("Error en formato de fecha:", e);
                dateText = "Error";
            }
        }
        
        if (timeVal) {
            // Pillamos los primeros 5 caracteres (HH:mm)
            timeText = String(timeVal).substring(0, 5);
        }

        return { dateText, timeText };
    };

    return (
        <motion.div 
            initial={{ y: '100%' }} 
            animate={{ y: 0 }} 
            exit={{ y: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed inset-0 z-[100] bg-zinc-950 p-6 pt-16 overflow-y-auto"
        >
            {/* BOTÓN CERRAR */}
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 active:scale-90 p-2">
                <X size={32}/>
            </button>

            <h2 className="text-4xl font-black italic text-white uppercase mb-8 tracking-tighter">
                Calendario <span className="text-lime-400">Nex</span>
            </h2>

            <div className="space-y-4 pb-24">
                {matches.map((m, i) => {
                    const { dateText, timeText } = getMatchDetails(m);
                    
                    return (
                        <div key={i} className="bg-zinc-900/40 border border-white/5 p-5 rounded-[2.2rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
                            
                            {/* Marca de agua de la Jornada */}
                            <span className="absolute -left-1 -top-1 text-3xl font-black text-white/[0.02] italic select-none">
                                J{i+1}
                            </span>

                            <div className="flex-1 text-left relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    {/* 📅 FECHA RESALTADA (Verde Lima) */}
                                    <span className="text-sm font-black uppercase text-lime-400 italic tracking-widest">
                                        {dateText}
                                    </span>
                                    
                                    {/* 🕒 HORA RESALTADA (Badge Digital) */}
                                    <span className="text-[10px] font-black bg-lime-400 text-black px-2.5 py-0.5 rounded-md shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                                        {timeText}H
                                    </span>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <span className={`font-black uppercase text-lg italic leading-none tracking-tight ${m.home_team_goals > m.away_team_goals ? 'text-lime-400' : 'text-white'}`}>
                                        {m.home_team}
                                    </span>
                                    <span className={`font-black uppercase text-lg italic leading-none tracking-tight ${m.away_team_goals > m.home_team_goals ? 'text-lime-400' : 'text-white'}`}>
                                        {m.away_team}
                                    </span>
                                </div>
                            </div>

                            {/* MARCADOR FINAL */}
                            <div className="flex flex-col items-end justify-center gap-1.5 border-l border-white/10 pl-6 ml-4">
                                <span className={`font-black italic text-2xl leading-none ${m.home_team_goals > m.away_team_goals ? 'text-lime-400' : 'text-white/40'}`}>
                                    {m.home_team_goals ?? '-'}
                                </span>
                                <span className={`font-black italic text-2xl leading-none ${m.away_team_goals > m.home_team_goals ? 'text-lime-400' : 'text-white/40'}`}>
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