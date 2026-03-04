import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ArrowRight, ArrowLeft, Smartphone, Zap, Star, X } from 'lucide-react';

const WelcomeTutorial = ({ user, onFinish, onFormOpen }) => {
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        {
            title: `¡BIENVENIDO, ${user?.name?.split(' ')[0].toUpperCase() || 'JUGADOR'}!`,
            content: `Estás a punto de vivir la experiencia VORA. Has sido invitado a disputar el torneo ${user?.league_name || 'VORA LEAGUE'} con el ${user?.team_name || 'tu equipo'}. Seguro que querrás tener un papel reseñable, así que aquí tienes unas indicaciones clave.`,
            icon: <Star className="text-lime-400" size={56} />
        },
        {
            title: "TU CROMO OFICIAL",
            content: "Seguro que siempre has querido verte como las grandes estrellas. Para que parezca un auténtico cromo, busca un fondo de un solo color (blanco o liso) al hacerte el selfie. ¡Podrás probar tantas veces como quieras!",
            icon: <Camera className="text-lime-400" size={56} />
        },
        {
            title: "¿CÓMO CRECEN TUS STATS?",
            content: "Tras cada partido los capitanes registrarán el resultado. Recibirás una notificación: entra y confirma tus goles y asistencias. ¡Verás como tus estadísticas y tu carta suben de nivel según tu rendimiento!",
            icon: <Zap className="text-lime-400" size={56} />
        },
        {
            title: "EXPERIENCIA TOTAL",
            content: "Para no perderte nada y recibir los avisos de tus goles, instala la App VORA en tu móvil. Es un paso sencillo que solo harás una vez y cambiará tu forma de vivir el torneo.",
            icon: <Smartphone className="text-lime-400" size={56} />
        }
    ];

    const next = () => currentStep === 4 ? onFinish() : setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-center p-8 font-sans">
            {/* Barra de Progreso */}
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
                    className="max-w-md w-full space-y-8 text-center"
                >
                    <div className="flex justify-center drop-shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                        {steps[currentStep-1].icon}
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none italic">
                            {steps[currentStep-1].title}
                        </h2>
                        <div className="w-12 h-1 bg-lime-400 mx-auto rounded-full" />
                        <p className="text-xl text-white/60 font-medium leading-relaxed px-2">
                            {steps[currentStep-1].content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navegación Inferior */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center justify-between max-w-md mx-auto w-full">
                <button 
                    onClick={prev}
                    className={`p-5 rounded-full border-2 border-white/5 bg-white/5 active:scale-90 transition-all ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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