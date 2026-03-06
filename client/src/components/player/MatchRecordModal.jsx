import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Loader2, Plus, Minus } from 'lucide-react'; 
import API_BASE_URL from '../../apiConfig';

const MatchRecordModal = ({ match, user, onComplete }) => {
    const [scoreHome, setScoreHome] = useState(match?.score_home ?? 0);
    const [scoreAway, setScoreAway] = useState(match?.score_away ?? 0);
    const [loading, setLoading] = useState(false);

    if (!match || !user) return null;

    const isValidationMode = match.status === 'awaiting_validation' && 
                            match.score_proposer_id !== user.id &&
                            match.score_proposer_id !== null;

    const handleScore = (team, delta) => {
        if (isValidationMode) return; // Si es validación, no se toca el marcador
        if (team === 'home') setScoreHome(prev => Math.max(0, prev + delta));
        else setScoreAway(prev => Math.max(0, prev + delta));
    };

    const handleSubmit = async (isValidating) => {
        if (loading) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/leagues/matches/${match.id}/report-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    score_home: scoreHome,
                    score_away: scoreAway,
                    action: isValidating ? 'VALIDATE' : 'PROPOSE'
                })
            });
            if (res.ok) onComplete();
        } catch (err) { console.error("🚨 Error:", err); } 
        finally { setLoading(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
                
                {/* Cabecera */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-black">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black uppercase italic text-white">Acta del Partido</h3>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Confirmación de resultado oficial</p>
                    </div>
                </div>

                {/* Marcador Táctico */}
                <div className="flex justify-around items-center gap-2 my-8">
                    
                    {/* Equipo Local */}
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 truncate w-24 text-center">{match.home_team}</p>
                        <div className="flex flex-col items-center gap-2">
                            {!isValidationMode && (
                                <button onClick={() => handleScore('home', 1)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lime-400 active:scale-90 transition-all"><Plus size={24}/></button>
                            )}
                            <div className="text-6xl font-black text-white py-2 tabular-nums">{scoreHome}</div>
                            {!isValidationMode && (
                                <button onClick={() => handleScore('home', -1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20 active:scale-90 transition-all"><Minus size={24}/></button>
                            )}
                        </div>
                    </div>

                    <div className="text-xl font-black text-zinc-800 self-center mb-4">VS</div>

                    {/* Equipo Visitante */}
                    <div className="flex flex-col items-center gap-3 flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 truncate w-24 text-center">{match.away_team}</p>
                        <div className="flex flex-col items-center gap-2">
                            {!isValidationMode && (
                                <button onClick={() => handleScore('away', 1)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lime-400 active:scale-90 transition-all"><Plus size={24}/></button>
                            )}
                            <div className="text-6xl font-black text-white py-2 tabular-nums">{scoreAway}</div>
                            {!isValidationMode && (
                                <button onClick={() => handleScore('away', -1)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20 active:scale-90 transition-all"><Minus size={24}/></button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="space-y-3 mt-10">
                    {isValidationMode ? (
                        <>
                            <button onClick={() => handleSubmit(true)} disabled={loading} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all">
                                {loading ? <Loader2 className="animate-spin"/> : <><Check size={20}/> CONFIRMAR RESULTADO</>}
                            </button>
                            <button onClick={() => handleSubmit(false)} disabled={loading} className="w-full bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase italic text-xs active:scale-95 transition-all">EL RESULTADO ES INCORRECTO</button>
                        </>
                    ) : (
                        <button onClick={() => handleSubmit(false)} disabled={loading} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic active:scale-95 transition-all flex items-center justify-center">
                            {loading ? <Loader2 className="animate-spin text-black" /> : "ENVIAR RESULTADO"}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MatchRecordModal;