import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ArrowRight, ArrowLeft, Smartphone, Zap, Star } from 'lucide-react';

const WelcomeTutorial = ({ user, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // Extraemos los datos que vienen del backend
    const playerName = user?.name?.split(' ')[0].toUpperCase() || 'JUGADOR';
    const leagueName = user?.league_name || 'tu competición';
    const teamName = user?.team_name || 'tu equipo';

    const steps = [
        {
            title: `¡BIENVENIDO,\n${playerName}!`,
            content: `Estás a un paso de vivir la experiencia VORA.\n\nHas sido convocado para disputar la liga ${leagueName} defendiendo los colores de ${teamName}.\n\nPrepárate para dar el máximo nivel en cada encuentro.`,
            icon: <Star className="text-lime-400" size={50} />
        },
        {
            title: "TU CROMO OFICIAL",
            image: "/tutorial-card.webp", // Imagen solicitada
            content: "Es hora de verte como una estrella.\n\nBusca una pared de color liso para tu selfie: así la tarjeta quedará limpia y profesional.\n\nNo te preocupes, puedes repetirla todas las veces que necesites.",
            icon: <Camera className="text-lime-400" size={50} />
        },
        {
            title: "TUS ESTADÍSTICAS",
            content: "Tras cada partido, tus capitanes registrarán el resultado final.\n\nEn ese momento recibirás una notificación: entra rápido para indicar tus goles y asistencias.\n\n¡Mira cómo crece tu puntuación Fut y mejora tu carta tras cada jornada!",
            icon: <Zap className="text-lime-400" size={50} />
        },
        {
            title: "INSTALA LA APP",
            content: "Haz este paso una única vez para no perderte nada.\n\nInstala VORA como aplicación en tu pantalla de inicio para recibir alertas de tus partidos y ver tus estadísticas al instante.\n\n¡Nos vemos en el campo!",
            icon: <Smartphone className="text-lime-400" size={50} />
        }
    ];

    const next = () => currentStep === 4 ? onFinish() : setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-start pt-12 px-8 font-sans">
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-md w-full space-y-6 text-center"
                >
                    {/* Icono Principal */}
                    <div className="flex justify-center drop-shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                        {steps[currentStep-1].icon}
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9] whitespace-pre-line">
                            {steps[currentStep-1].title}
                        </h2>
                        
                        <div className="w-12 h-1 bg-lime-400 mx-auto rounded-full" />

                        {/* Imagen dinámica para el paso 2 */}
                        {steps[currentStep-1].image && (
                            <motion.img 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={steps[currentStep-1].image} 
                                className="h-48 mx-auto my-4 drop-shadow-2xl rounded-2xl border border-white/5"
                                alt="Tutorial Card"
                            />
                        )}

                        <p className="text-lg text-white/70 font-medium leading-relaxed whitespace-pre-line px-2">
                            {steps[currentStep-1].content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navegación Inferior */}
            <div className="absolute bottom-12 left-0 right-0 px-8 flex items-center justify-between max-w-md mx-auto w-full">
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
                    className="bg-lime-400 text-black p-4 rounded-full shadow-[0_10px_30px_rgba(163,230,53,0.3)] active:scale-90 transition-all"
                >
                    {currentStep === 4 ? <Check size={24} strokeWidth={3} /> : <ArrowRight size={24} strokeWidth={3} />}
                </button>
            </div>
        </div>
    );
};

export default WelcomeTutorial;