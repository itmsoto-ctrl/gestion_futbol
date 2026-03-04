import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ArrowRight, ArrowLeft, Smartphone, Zap, Star } from 'lucide-react';

const WelcomeTutorial = ({ user, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(1);

    const playerName = user?.name?.split(' ')[0].toUpperCase() || 'JUGADOR';
    const leagueName = user?.league_name || 'tu liga';
    const teamName = user?.team_name || 'tu equipo';

    const steps = [
        {
            title: `¡BIENVENIDO,\n${playerName}!`,
            content: `Estás a punto de vivir la experiencia VORA.\n\nHas sido invitado a disputar el torneo ${leagueName} con el equipo ${teamName}.\n\nSeguro que querrás tener un papel reseñable, así que prepárate para disfrutar al máximo.`,
            icon: <Star className="text-lime-400" size={56} />
        },
        {
            title: "TU CROMO OFICIAL",
            image: "/tutorial-card.webp",
            content: "Para que tu tarjeta parezca un auténtico cromo,\nbusca una pared de color liso para tu selfie.\n\nTranquilo, podrás probarlo tantas veces como quieras hasta que quede perfecto.",
            icon: <Camera className="text-lime-400" size={56} />
        },
        {
            title: "¿CÓMO MEJORAR?",
            content: "Tras cada partido, los capitanes registrarán el resultado final.\n\nEn ese momento, recibirás una notificación push para entrar en VORA e indicar tus goles y asistencias.\n\n¡Mira cómo crece tu puntuación y tu carta según tu rendimiento!",
            icon: <Zap className="text-lime-400" size={56} />
        },
        {
            title: "EXPERIENCIA TOTAL",
            content: "Para no perderte nada y tener la mejor experiencia,\nhaz este simple paso una única vez:\n\nInstala la App en tu pantalla de inicio para recibir alertas y ver tus estadísticas al instante.",
            icon: <Smartphone className="text-lime-400" size={56} />
        }
    ];

    const next = () => currentStep === 4 ? onFinish() : setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-start pt-16 px-8 font-sans overflow-hidden">
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-md w-full flex flex-col items-center text-center"
                >
                    <div className="mb-6 drop-shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                        {steps[currentStep-1].icon}
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9] whitespace-pre-line">
                            {steps[currentStep-1].title}
                        </h2>
                        
                        <div className="w-16 h-1.5 bg-lime-400 mx-auto rounded-full" />

                        {steps[currentStep-1].image && (
                            <motion.img 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={steps[currentStep-1].image} 
                                className="h-48 mx-auto my-2 rounded-2xl shadow-2xl border border-white/5"
                                alt="Card Preview"
                            />
                        )}

                        <p className="text-xl text-white/70 font-medium leading-relaxed whitespace-pre-line">
                            {steps[currentStep-1].content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center justify-between max-w-md mx-auto w-full">
                <button 
                    onClick={prev}
                    className={`p-5 rounded-full bg-white/5 active:scale-90 transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                >
                    <ArrowLeft size={28} />
                </button>

                <div className="flex gap-3">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-2 rounded-full transition-all duration-500 ${s === currentStep ? 'bg-lime-400 w-8' : 'bg-white/10 w-2'}`} />
                    ))}
                </div>

                <button 
                    onClick={next}
                    className="bg-lime-400 text-black p-5 rounded-full shadow-[0_10px_30px_rgba(163,230,53,0.4)] active:scale-90 transition-all border-4 border-black/10"
                >
                    {currentStep === 4 ? <Check size={28} strokeWidth={3} /> : <ArrowRight size={28} strokeWidth={3} />}
                </button>
            </div>
        </div>
    );
};

export default WelcomeTutorial;