// client/src/components/portal/WelcomeTutorial.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ArrowRight, ArrowLeft, Smartphone, Zap, Star } from 'lucide-react';

const WelcomeTutorial = ({ user, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // Datos dinámicos del usuario (DANI, REVISAR BACKEND SI NO CARGAN)
    const playerName = user?.name?.split(' ')[0].toUpperCase() || 'JUGADOR';
    const leagueName = user?.league_name || 'la competición';
    const teamName = user?.team_name || 'tu equipo';

    const steps = [
        {
            title: `¡BIENVENIDO,\n${playerName}!`,
            content: `Has sido formalmente invitado a participar en ${leagueName}.\n\nDefenderás los colores de ${teamName}.\n\nAsegúrate de estar preparado para dar el máximo nivel en cada encuentro.`,
            icon: <Star className="text-lime-400" size={50} />
        },
        {
            title: "TU FICHA OFICIAL",
            image: "/tutorial-card.webp", // Imagen solicitada por el usuario
            content: "Es hora de verte como una estrella de fútbol.\n\nBusca una pared de color liso para tu selfie: así la tarjeta quedará limpia y profesional.\n\nPodrás probar tantas veces como necesites hasta que te veas perfecto.",
            icon: <Camera className="text-lime-400" size={50} />
        },
        {
            title: "SUBE TUS ESTADÍSTICAS",
            content: "Tras cada partido, los capitanes registrarán el resultado oficial.\n\nEn ese momento, recibirás una notificación push: entra rápido para indicar tus goles y asistencias.\n\n¡Verás cómo mejora tu puntuación Fut y tu carta jornada tras jornada!",
            icon: <Zap className="text-lime-400" size={50} />
        },
        {
            title: "INSTALA VORA",
            content: "Haz este paso una única vez para garantizar la mejor experiencia.\n\nInstala VORA como aplicación en tu pantalla de inicio para recibir alertas de tus partidos y ver tus resultados al instante.\n\n¡Nos vemos en el campo!",
            icon: <Smartphone className="text-lime-400" size={50} />
        }
    ];

    const next = () => currentStep === 4 ? onFinish() : setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-start pt-16 px-6 pb-24 font-sans overflow-hidden">
            
            {/* Barra de Progreso Superior */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
                <motion.div 
                    className="h-full bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.5)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / 4) * 100}%` }}
                />
            </div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentStep}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex-1 max-w-md w-full flex flex-col items-center text-center overflow-hidden"
                >
                    {/* Icono Principal (Fijo arriba del contenido) */}
                    <div className="mb-4 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                        {steps[currentStep-1].icon}
                    </div>

                    {/* ✅ Area de contenido principal con scrollable */}
                    <div className="flex-1 w-full overflow-y-auto space-y-6 px-2 pb-4 scrollbar-thin">
                        <div className="space-y-4 pt-1">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9] whitespace-pre-line">
                                {steps[currentStep-1].title}
                            </h2>
                            <div className="w-12 h-1 bg-lime-400 mx-auto rounded-full" />
                        </div>

                        {/* Imagen dinámica para el paso 2 (Escala ajustada para moviles) */}
                        {steps[currentStep-1].image && (
                            <motion.img 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={steps[currentStep-1].image} 
                                className="h-44 mx-auto my-1 rounded-2xl shadow-2xl border border-white/5"
                                alt="FUT Card Preview"
                            />
                        )}

                        <p className="text-xl text-white/70 font-medium leading-relaxed whitespace-pre-line">
                            {steps[currentStep-1].content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* ✅ Botones en la parte inferior, fijos sobre el scroll */}
            <div className="fixed bottom-12 left-0 right-0 px-6 flex items-center justify-between max-w-md mx-auto w-full z-10">
                <button 
                    onClick={prev}
                    className={`p-4 rounded-full border border-white/10 bg-white/5 active:scale-90 transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${s === currentStep ? 'bg-lime-400 w-6' : 'bg-white/10 w-2'}`} />
                    ))}
                </div>

                <button 
                    onClick={next}
                    className="bg-lime-400 text-black p-4 rounded-full shadow-[0_10px_25px_rgba(163,230,53,0.3)] active:scale-90 transition-all"
                >
                    {currentStep === 4 ? <Check size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
                </button>
            </div>
        </div>
    );
};

export default WelcomeTutorial;