import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const StandingsModal = ({ standings, onClose }) => {
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
            <h2 className="text-3xl font-black italic text-lime-400 uppercase mb-6 tracking-tighter">Clasificación</h2>
            
            <div className="bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-[10px] font-black uppercase text-white/40 italic">
                            <th className="p-4 py-3 border-b border-white/10">#</th>
                            <th className="p-4 py-3 border-b border-white/10">Equipo</th>
                            <th className="p-4 py-3 border-b border-white/10 text-center">PJ</th>
                            <th className="p-4 py-3 border-b border-white/10 text-center">PTS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {standings.map((team, idx) => (
                            <tr key={team.name} className={`border-b border-white/5 last:border-0 ${idx < 3 ? 'bg-lime-400/5' : ''}`}>
                                <td className={`p-4 font-black italic ${idx === 0 ? 'text-lime-400' : 'text-white/40'}`}>{idx + 1}</td>
                                <td className="p-4 font-bold uppercase text-sm text-white">{team.name}</td>
                                <td className="p-4 text-center text-white/60 font-bold">{team.pj}</td>
                                <td className="p-4 text-center text-lime-400 font-black italic">{team.pts}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default StandingsModal;