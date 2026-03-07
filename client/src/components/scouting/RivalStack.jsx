import React, { useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { X, Heart, RotateCcw } from 'lucide-react';
import FutCard from '../FutCard';

const MOCK_RIVALS = [
    { id: 1, name: 'VINÍCIUS', position: 'EI', rating: 89, country_code: 'br', stats: {pac: 95, sho: 82, pas: 81, dri: 90, def: 29, phy: 68} },
    { id: 2, name: 'BELLINGHAM', position: 'MC', rating: 86, country_code: 'gb', stats: {pac: 82, sho: 84, pas: 85, dri: 88, def: 78, phy: 82} },
    { id: 3, name: 'MBAPPÉ', position: 'DC', rating: 91, country_code: 'fr', stats: {pac: 97, sho: 90, pas: 80, dri: 92, def: 36, phy: 78} },
].reverse();

const RivalStack = () => {
    const [cards, setCards] = useState(MOCK_RIVALS);
    const [history, setHistory] = useState([]);

    const removeCard = useCallback((id, direction) => {
        const cardToRemove = cards.find(c => c.id === id);
        if (cardToRemove) {
            setHistory(prev => [...prev, cardToRemove]);
            setCards(prev => prev.filter(card => card.id !== id));
        }
    }, [cards]);

    const undoLast = () => {
        if (history.length === 0) return;
        const lastCard = history[history.length - 1];
        setCards(prev => [...prev, lastCard]);
        setHistory(prev => prev.slice(0, -1));
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full p-4">
            <div className="relative w-[320px] h-[460px]">
                <AnimatePresence>
                    {cards.map((player, index) => (
                        <SwipeableCard 
                            key={player.id} 
                            player={player} 
                            isFront={index === cards.length - 1}
                            onSwipe={(dir) => removeCard(player.id, dir)}
                        />
                    ))}
                </AnimatePresence>
                {cards.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <p className="text-lime-400 font-black italic text-xl uppercase">Mazo vacío</p>
                        <button onClick={() => setCards(MOCK_RIVALS)} className="mt-4 text-white/40 text-[10px] font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-full">Recargar</button>
                    </div>
                )}
            </div>

            {/* BOTONES DE CONTROL */}
            <div className="flex items-center gap-6 mt-10">
                <button onClick={undoLast} disabled={history.length === 0} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 active:scale-90 transition-all disabled:opacity-20"><RotateCcw size={20}/></button>
                <button onClick={() => cards.length > 0 && removeCard(cards[cards.length-1].id, 'left')} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-red-500 shadow-xl active:scale-90 transition-all"><X size={32} strokeWidth={3}/></button>
                <button onClick={() => cards.length > 0 && removeCard(cards[cards.length-1].id, 'right')} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lime-400 shadow-xl active:scale-90 transition-all"><Heart size={32} fill="currentColor"/></button>
            </div>
        </div>
    );
};

const SwipeableCard = ({ player, isFront, onSwipe }) => {
    const x = useMotionValue(0);
    
    // 💫 AQUÍ ESTÁ EL TRUCO: A medida que 'x' se aleja del centro, 'rotate' aumenta
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    return (
        <motion.div
            style={{ x, rotate, opacity, zIndex: isFront ? 10 : 0, position: 'absolute' }}
            drag={isFront ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
                if (info.offset.x > 100) onSwipe('right');
                else if (info.offset.x < -100) onSwipe('left');
            }}
            initial={{ scale: 0.9, y: 15, opacity: 0 }}
            animate={{ scale: isFront ? 1 : 0.95, y: isFront ? 0 : 10, opacity: 1 }}
            exit={{ 
                x: x.get() < 0 ? -500 : 500, 
                opacity: 0, 
                rotate: x.get() < 0 ? -45 : 45, // Sale rotando más fuerte al irse
                transition: { duration: 0.4, ease: "easeInOut" } 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="cursor-grab active:cursor-grabbing"
        >
            <FutCard player={player} showAnim={false} showShine={false} showVideo={false} />
        </motion.div>
    );
};

export default RivalStack;