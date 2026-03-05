import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import FutCard from '../FutCard'; 

const RosterModal = ({ roster, onClose }) => {
    return (
        <motion.div 
            initial={{y:'100%'}} 
            animate={{y:0}} 
            exit={{y:'100%'}} 
            transition={{type: 'spring', damping: 25, stiffness: 200}} 
            className="absolute inset-0 z-[100] bg-zinc-950/95 backdrop-blur-xl pt-16 overflow-hidden ml-16 sm:ml-20 flex flex-col"
        >
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 active:scale-90 z-50">
                <X size={32}/>
            </button>
            
            <div className="px-6 shrink-0">
                <h2 className="text-3xl font-black italic text-lime-400 uppercase mb-1 tracking-tighter">Plantilla</h2>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Desliza para ver el equipo</p>
            </div>

            {/* 📱 Contenedor Slider Nativo (CSS Snap) */}
            <div 
                className="flex-1 flex overflow-x-auto snap-x snap-mandatory items-center gap-4 px-10 pb-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Oculta la barra de scroll
            >
                {/* Truco para ocultar scrollbar en Webkit/Chrome/Safari */}
                <style>{`
                    div::-webkit-scrollbar { display: none; }
                `}</style>

                {roster && roster.length > 0 ? (
                    roster.map((player, idx) => (
                        // Ajustamos la escala a 0.75 para que las cartas quepan bien en la pantalla
                        <div key={idx} className="snap-center shrink-0 transform scale-[0.75] origin-center drop-shadow-2xl">
                            <FutCard player={player} />
                        </div>
                    ))
                ) : (
                    <div className="w-full text-center text-white/40 font-bold uppercase italic mt-20">
                        Buscando jugadores...
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RosterModal;