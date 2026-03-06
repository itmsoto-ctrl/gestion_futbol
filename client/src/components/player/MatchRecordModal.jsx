import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Zap } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const MatchRecordModal = ({ match, user, onComplete }) => {
    const [scoreHome, setScoreHome] = useState(match.score_home || 0);
    const [scoreAway, setScoreAway] = useState(match.score_away || 0);
    const [loading, setLoading] = useState(false);

    // ¿Soy yo el que tiene que validar lo que puso el otro?
    const isValidationMode = match.status === 'awaiting_validation' && match.score_proposer_id !== user.id;

    const handleSubmit = async (validated) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/leagues/matches/${match.id}/report-score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({
                    score_home: scoreHome,
                    score_away: scoreAway,
                    action: validated ? 'VALIDATE' : 'PROPOSE'
                })
            });
            if (res.ok) onComplete();
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-black">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase italic italic">Acta del Partido</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Finalizado: {match.home_team} vs {match.away_team}</p>
                    </div>
                </div>

                <div className="flex justify-between items-center gap-4 my-10">
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 truncate">{match.home_team}</p>
                        <input type="number" value={scoreHome} onChange={(e) => !isValidationMode && setScoreHome(parseInt(e.target.value))} 
                               className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 text-4xl font-black text-center outline-none focus:border-lime-400" />
                    </div>
                    <div className="text-2xl font-black text-zinc-700 mt-6">VS</div>
                    <div className="text-center flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-2 truncate">{match.away_team}</p>
                        <input type="number" value={scoreAway} onChange={(e) => !isValidationMode && setScoreAway(parseInt(e.target.value))}
                               className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-6 text-4xl font-black text-center outline-none focus:border-lime-400" />
                    </div>
                </div>

                {isValidationMode ? (
                    <div className="space-y-3">
                        <button onClick={() => handleSubmit(true)} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic flex items-center justify-center gap-2">
                            <Check /> CONFIRMAR RESULTADO
                        </button>
                        <button onClick={() => handleSubmit(false)} className="w-full bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase italic text-xs">EL RESULTADO NO ES CORRECTO</button>
                    </div>
                ) : (
                    <button onClick={() => handleSubmit(false)} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic">
                        ENVIAR PARA VALIDACIÓN
                    </button>
                )}
                
                <p className="mt-6 text-[9px] text-center text-zinc-500 uppercase font-bold px-4">
                    Al confirmar, se habilitará el reclamo de goles para todos los jugadores.
                </p>
            </div>
        </motion.div>
    );
};

export default MatchRecordModal;