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
        if (isValidationMode) return; 
        if (team === 'home') setScoreHome(prev => Math.max(0, prev + delta));
        else setScoreAway(prev => Math.max(0, prev + delta));
    };

    const handleSubmit = async (actionType) => {
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
                    action: actionType
                })
            });
            if (res.ok) onComplete();
        } catch (err) { 
            console.error("🚨 Error:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
        >
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[3rem] p-6 shadow-2xl overflow-hidden">
                
                {/* Cabecera */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black mb-3 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        <Zap size={24} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-black uppercase italic text-white leading-tight">Acta del Partido</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-1">Confirmación de Marcador</p>
                </div>

                {/* Marcador Táctico en Amarillo */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 mb-8">
                    
                    {/* Local */}
                    <div className="flex flex-col items-center text-center">
                        <div className="min-h-[45px] flex items-center justify-center mb-2">
                            <span className="text-[12px] font-black uppercase text-yellow-400 leading-tight">
                                {match.home_team}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            {!isValidationMode && (
                                <button onClick={() => handleScore('home', 1)} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400 active:scale-90 transition-all border border-white/5"><Plus size={28}/></button>
                            )}
                            <div className="text-7xl font-black text-yellow-400 tabular-nums leading-none my-2">{scoreHome}</div>
                            {!isValidationMode && (
                                <button onClick={() => handleScore('home', -1)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 active:scale-90 transition-all border border-white/5"><Minus size={28}/></button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center h-full pt-20">
                        <div className="text-xs font-black text-zinc-700 bg-zinc-800/50 px-2 py-1 rounded-md">VS</div>
                    </div>

                    {/* Visitante */}
                    <div className="flex flex-col items-center text-center">
                        <div className="min-h-[45px] flex items-center justify-center mb-2">
                            <span className="text-[12px] font-black uppercase text-yellow-400 leading-tight">
                                {match.away_team}
                            </span>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            {!isValidationMode && (
                                <button onClick={() => handleScore('away', 1)} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-yellow-400 active:scale-90 transition-all border border-white/5"><Plus size={28}/></button>
                            )}
                            <div className="text-7xl font-black text-yellow-400 tabular-nums leading-none my-2">{scoreAway}</div>
                            {!isValidationMode && (
                                <button onClick={() => handleScore('away', -1)} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 active:scale-90 transition-all border border-white/5"><Minus size={28}/></button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="space-y-3 mt-4">
                    {isValidationMode ? (
                        <>
                            <button onClick={() => handleSubmit('VALIDATE')} disabled={loading} className="w-full bg-yellow-400 text-black font-black py-5 rounded-2xl uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                                {loading ? <Loader2 className="animate-spin"/> : <><Check size={20}/> CONFIRMAR RESULTADO</>}
                            </button>
                            <button onClick={() => handleSubmit('REJECT')} disabled={loading} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-2xl uppercase italic text-xs active:scale-95 transition-all border border-red-500/20">
                                IMPUGNAR RESULTADO
                            </button>
                        </>
                    ) : (
                        <button onClick={() => handleSubmit('PROPOSE')} disabled={loading} className="w-full bg-yellow-400 text-black font-black py-5 rounded-2xl uppercase italic active:scale-95 transition-all flex items-center justify-center shadow-lg">
                            {loading ? <Loader2 className="animate-spin text-black" /> : "ENVIAR RESULTADO"}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MatchRecordModal;