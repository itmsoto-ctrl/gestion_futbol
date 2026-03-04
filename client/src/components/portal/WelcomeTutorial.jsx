import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ArrowRight, ArrowLeft, Smartphone, Zap, Star } from 'lucide-react';

const WelcomeTutorial = ({ user, onFinish }) => {
    const [currentStep, setCurrentStep] = useState(1);

    // Datos dinámicos del usuario
    const playerName = user?.name?.split(' ')[0].toUpperCase() || 'JUGADOR';
    const leagueName = user?.league_name || 'tu liga oficial';
    const teamName = user?.team_name || 'tu equipo';

    const steps = [
        {
            title: `¡BIENVENIDO,\n${playerName}!`,
            content: `Has sido formalmente convocado para disputar la liga ${leagueName}.\n\nDefenderás los colores de ${teamName}.\n\nPrepárate para demostrar tu talento y liderar a tu equipo hacia la victoria.`,
            icon: <Star className="text-lime-400" size={50} />
        },
        {
            title: "TU FICHA OFICIAL",
            image: "/tutorial-card.webp",
            content: "Es hora de presentarte ante la liga como una estrella.\n\nBusca una iluminación clara y un fondo liso para tu selfie: así tu tarjeta lucirá impecable.\n\nPodrás repetir la captura hasta que el resultado sea perfecto.",
            icon: <Camera className="text-lime-400" size={50} />
        },
        {
            title: "ESTADÍSTICAS FUT",
            content: "Tras cada jornada, los responsables registrarán el marcador oficial.\n\nEn ese momento, recibirás una notificación push: accede de inmediato para indicar tus goles y asistencias.\n\n¡Mira cómo mejora tu puntuación Fut y evoluciona tu carta tras cada partido!",
            icon: <Zap className="text-lime-400" size={50} />
        },
        {
            title: "INSTALA VORA",
            content: "Haz este paso una única vez para garantizar la mejor experiencia.\n\nInstala VORA como aplicación en tu pantalla de inicio para recibir alertas de tus próximos encuentros y visualizar tus resultados en tiempo real.\n\n¡Nos vemos en el campo!",
            icon: <Smartphone className="text-lime-400" size={50} />
        }
    ];

    const next = () => currentStep === 4 ? onFinish() : setCurrentStep(prev => prev + 1);
    const prev = () => setCurrentStep(prev => prev - 1);

    return (
        <div className="fixed inset-0 z-[200] bg-zinc-950 text-white flex flex-col items-center justify-start pt-16 px-6 font-sans italic overflow-hidden">
            
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
                    <div className="mb-4 drop-shadow-[0_0_15px_rgba(163,230,53,0.3)]">
                        {steps[currentStep-1].icon}
                    </div>

                    {/* Area de contenido con scrollable para evitar solapamientos */}
                    <div className="flex-1 w-full overflow-y-auto space-y-6 px-2 pb-10 scrollbar-hide">
                        <div className="space-y-4 pt-1">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-[0.9] whitespace-pre-line">
                                {steps[currentStep-1].title}
                            </h2>
                            <div className="w-12 h-1 bg-lime-400 mx-auto rounded-full" />
                        </div>

                        {/* Imagen dinámica para el paso 2 */}
                        {steps[currentStep-1].image && (
                            <motion.img 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={steps[currentStep-1].image} 
                                className="h-44 mx-auto my-1 rounded-2xl shadow-2xl border border-white/5"
                                alt="FUT Preview"
                            />
                        )}

                        <p className="text-xl text-white/70 font-medium leading-relaxed whitespace-pre-line">
                            {steps[currentStep-1].content}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Botones de Navegación Fijos */}
            <div className="fixed bottom-10 left-0 right-0 px-8 flex items-center justify-between max-w-md mx-auto w-full z-10">
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