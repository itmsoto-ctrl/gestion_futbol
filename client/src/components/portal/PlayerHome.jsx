import React, { useState, useEffect } from 'react';
import { Camera, X, Star, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerHome = () => {
    const [user, setUser] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Aquí simularemos que obtenemos el usuario del localStorage o de una sesión
        // En el futuro usaremos el token de login
        const fetchUserData = async () => {
            try {
                // Supongamos que guardamos el email al registrarse para esta prueba
                const savedEmail = localStorage.getItem('userEmail'); 
                const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail })
                });
                const data = await res.json();
                
                if (data.exists) {
                    setUser(data);
                    // 🚨 LÓGICA DEL MODAL: Si no hay foto, abrimos modal
                    if (!data.photo_url) {
                        setTimeout(() => setShowPhotoModal(true), 1000);
                    }
                }
            } catch (err) {
                console.error("Error cargando perfil");
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white font-sans relative">
            
            {/* 1. SECCIÓN FUT CARD (Protagonismo total) */}
            <div className="p-6 flex flex-col items-center pt-10">
                <div className="w-full max-w-[320px] aspect-[2/3] bg-gradient-to-b from-lime-400 to-lime-600 rounded-[2rem] shadow-[0_0_50px_rgba(163,230,53,0.3)] flex items-center justify-center border-4 border-white/20 relative overflow-hidden">
                    {/* Placeholder de la FutCard hasta que la diseñemos */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="text-center p-6 z-10">
                        <Star className="text-black/20 absolute top-4 right-4" size={40} />
                        <div className="w-32 h-32 bg-black/10 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-black/20">
                            <Camera size={40} className="text-black/40" />
                        </div>
                        <h3 className="text-black font-black italic text-2xl uppercase leading-none italic">{user?.name || 'TU NOMBRE'}</h3>
                        <p className="text-black/60 font-bold text-xs tracking-widest mt-2 uppercase">Ficha de Jugador</p>
                    </div>
                </div>
            </div>

            {/* 2. CONTENIDO ADICIONAL (Placeholder) */}
            <div className="p-6 space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <ShieldCheck className="text-lime-400" />
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Estado de Ficha</p>
                        <p className="font-bold text-sm italic uppercase tracking-tighter">Jugador Verificado</p>
                    </div>
                </div>
            </div>

            {/* ----------------------------------------------------------- */}
            {/* MODAL SELFIE: "VIVE LA EXPERIENCIA VORA" */}
            {/* ----------------------------------------------------------- */}
            {showPhotoModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPhotoModal(false)} />
                    
                    <div className="relative w-full max-w-md bg-[#2a2a2a] rounded-[2.5rem] p-8 text-center shadow-2xl border border-white/10 animate-in slide-in-from-bottom duration-500">
                        <button 
                            onClick={() => setShowPhotoModal(false)}
                            className="absolute top-6 right-6 text-white/20 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="w-20 h-20 bg-lime-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.4)]">
                            <Camera size={32} className="text-black" />
                        </div>

                        <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter mb-4 text-white">
                            Vive la experiencia <br/> <span className="text-lime-400 text-4xl italic">VORA</span>
                        </h2>
                        
                        <p className="text-white/70 text-sm font-medium leading-relaxed mb-8 px-4">
                            Consigue tu tarjeta <span className="text-white font-bold italic underline">FutCard</span> personalizada como si fuera un cromo de fútbol profesional. Hazte un selfie y alucina con el resultado.
                        </p>

                        <button 
                            className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase italic text-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                            onClick={() => alert("Aquí abriremos la cámara...")}
                        >
                            ¡HACERME EL SELFIE!
                        </button>
                        
                        <button 
                            onClick={() => setShowPhotoModal(false)}
                            className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/20"
                        >
                            Quizás en otro momento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerHome;