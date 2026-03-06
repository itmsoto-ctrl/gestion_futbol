import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Zap, Loader2 } from 'lucide-react'; // 👈 Añadido Loader2
import API_BASE_URL from '../../apiConfig';

const MatchRecordModal = ({ match, user, onComplete }) => {
    // 🛡️ LOS HOOKS SIEMPRE ARRIBA (Sin condiciones antes)
    const [scoreHome, setScoreHome] = useState(match?.score_home ?? 0);
    const [scoreAway, setScoreAway] = useState(match?.score_away ?? 0);
    const [loading, setLoading] = useState(false);

    // 🛡️ AHORA SÍ: Si no hay datos, retornamos null después de los hooks
    if (!match || !user) return null;

    console.log("🛠️ MODAL ACTA: Renderizando partido", match.id);

    const isValidationMode = match.status === 'awaiting_validation' && 
                            match.score_proposer_id !== user.id &&
                            match.score_proposer_id !== null;

    const handleSubmit = async (isValidating) => {
        if (loading) return;
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/leagues/matches/${match.id}/report-score`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    score_home: scoreHome,
                    score_away: scoreAway,
                    action: isValidating ? 'VALIDATE' : 'PROPOSE'
                })
            });

            if (res.ok) {
                onComplete();
            } else {
                const errorData = await res.json();
                alert(`Error: ${errorData.error || 'No se pudo enviar'}`);
            }
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
            className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
        >
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative">
                
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-black">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic text-white">Acta del Partido</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {match.home_team} vs {match.away_team}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 my-10">
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 truncate">{match.home_team}</p>
                        <input 
                            type="number" 
                            value={scoreHome} 
                            onChange={(e) => !isValidationMode && setScoreHome(Math.max(0, parseInt(e.target.value) || 0))} 
                            disabled={isValidationMode || loading}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 text-4xl font-black text-center text-white outline-none focus:border-lime-400 disabled:opacity-50" 
                        />
                    </div>
                    <div className="text-2xl font-black text-zinc-700 mt-6">VS</div>
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-400 mb-2 truncate">{match.away_team}</p>
                        <input 
                            type="number" 
                            value={scoreAway} 
                            onChange={(e) => !isValidationMode && setScoreAway(Math.max(0, parseInt(e.target.value) || 0))} 
                            disabled={isValidationMode || loading}
                            className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 text-4xl font-black text-center text-white outline-none focus:border-lime-400 disabled:opacity-50" 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    {isValidationMode ? (
                        <>
                            <button 
                                onClick={() => handleSubmit(true)} 
                                disabled={loading}
                                className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin text-black"/> : <><Check size={20}/> CONFIRMAR RESULTADO</>}
                            </button>
                            <button 
                                onClick={() => handleSubmit(false)} 
                                disabled={loading}
                                className="w-full bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase italic text-xs active:scale-95 transition-all"
                            >
                                EL RESULTADO NO ES CORRECTO
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => handleSubmit(false)} 
                            disabled={loading}
                            className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic active:scale-95 transition-all flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin text-black" /> : "ENVIAR PARA VALIDACIÓN"}
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default MatchRecordModal;