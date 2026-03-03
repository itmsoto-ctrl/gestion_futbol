import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ShieldCheck, RefreshCw, Check } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 

const PlayerHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // UI y Cámara
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Leemos el email que guardamos silenciosamente al acabar el registro
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) {
                    setLoading(false);
                    return; 
                }

                const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail })
                });
                const data = await res.json();
                
                if (data.exists) {
                    setUser(data);
                    // Si no tiene foto, abrimos la invitación para hacérsela
                    if (!data.photo_url) {
                        setTimeout(() => setShowPromoModal(true), 1000);
                    }
                }
            } catch (err) {
                console.error("Error cargando perfil:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setShowPromoModal(false);
        setIsCameraOpen(true);
        try {
            // Force facingMode: 'user' para que abra la frontal en móviles
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("Necesitamos permisos de cámara para crear tu carta.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            
            // Pasamos a Base64
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
            setPhotoPreview(imageDataUrl);
            stopCamera();
        }
    };

    const savePhoto = async () => {
        // ACTUALIZAMOS ESTADO EN VIVO PARA VER LA CARTA
        setUser({ ...user, photo_url: photoPreview });
        setPhotoPreview(null);
        
        // Aquí conectaremos con la API en el futuro para guardar la foto en tu BD
        console.log("Foto lista para enviar a BD");
    };

    // Construimos los datos falsos del jugador para la previsualización
    const playerStats = {
        name: user?.name || 'VORA PLAYER',
        rating: 85, // Generará oro.png
        position: 'DEL',
        is_goalkeeper: false,
        photo_url: user?.photo_url || photoPreview, // Pasamos la foto en tiempo real
        pac: 80, sho: 85, pas: 72, dri: 84, def: 35, phy: 70
    };

    if (loading) return <div className="min-h-screen bg-[#665C5A] flex items-center justify-center text-lime-400">Cargando vestuario...</div>;

    return (
        <div className="min-h-screen bg-[#665C5A] text-white font-sans relative overflow-x-hidden pb-10">
            /* MARCA DE VERSIÓN TEMPORAL */}
        <div className="fixed top-0 left-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 font-mono">
            V-TEST-SVG-MASK-01
        </div>
            <div className="p-6 flex flex-col items-center pt-10">
                <div onClick={() => !user?.photo_url && setShowPromoModal(true)} className="cursor-pointer">
                    <FutCard player={playerStats} size="large" view="dashboard" />
                </div>
                {!user?.photo_url && (
                    <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-lime-400 animate-pulse text-center">
                        ¡Toca la carta para añadir tu foto!
                    </p>
                )}
            </div>

            <div className="p-6 max-w-sm mx-auto w-full">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <ShieldCheck className="text-lime-400" />
                    <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Identidad Global</p>
                        <p className="font-bold text-sm italic uppercase tracking-tighter truncate w-48">{user?.email || 'Sin vincular'}</p>
                    </div>
                </div>
            </div>

            {/* MODAL 1: PROMO */}
            {showPromoModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPromoModal(false)} />
                    <div className="relative w-full max-w-md bg-[#2a2a2a] rounded-[2.5rem] p-8 text-center shadow-2xl border border-white/10 animate-in slide-in-from-bottom">
                        <button onClick={() => setShowPromoModal(false)} className="absolute top-6 right-6 text-white/20 hover:text-white"><X size={24} /></button>
                        <div className="w-20 h-20 bg-lime-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.4)]">
                            <Camera size={32} className="text-black" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter mb-4">
                            Vive la experiencia <br/> <span className="text-lime-400 text-4xl">VORA</span>
                        </h2>
                        <p className="text-white/70 text-sm font-medium mb-8">
                            Genera tu cromo de leyenda. Hazte un selfie y alucina con el resultado.
                        </p>
                        <button onClick={startCamera} className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase italic text-xl active:scale-95 transition-all">
                            ¡HACERME EL SELFIE!
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL 2: CÁMARA */}
            <div className={`fixed inset-0 z-50 bg-black flex flex-col transition-all duration-300 ${isCameraOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
                    <canvas ref={canvasRef} className="hidden" />
                    {/* Guía visual para la cara */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-64 border-2 border-lime-400/80 border-dashed rounded-[3rem]"></div>
                    </div>
                    <button onClick={stopCamera} className="absolute top-6 right-6 text-white bg-black/50 p-3 rounded-full"><X size={24} /></button>
                </div>
                <div className="h-40 bg-[#1a1a1a] pb-8 flex items-center justify-center border-t border-white/10">
                    <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full border-4 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.4)] active:scale-90 transition-all">
                        <Camera size={32} className="text-black" />
                    </button>
                </div>
            </div>

            {/* MODAL 3: PREVIEW FUSIONADO */}
            {photoPreview && (
                <div className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col animate-in fade-in">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 relative bg-cover bg-center" style={{ backgroundImage: "url('/bg-hero.webp')" }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                        <div className="z-10 scale-110 sm:scale-125">
                            <FutCard player={{...playerStats, photo_url: photoPreview}} size="large" view="dashboard" />
                        </div>
                    </div>
                    <div className="h-48 bg-[#2a2a2a] rounded-t-[2.5rem] p-6 flex flex-col justify-center gap-4 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                        <button onClick={savePhoto} className="w-full bg-lime-400 text-black font-black py-4 rounded-[2rem] uppercase italic flex items-center justify-center gap-2 text-lg active:scale-95 transition-all">
                            <Check size={24} /> ACEPTAR FOTO
                        </button>
                        <button onClick={() => { setPhotoPreview(null); startCamera(); }} className="w-full bg-white/10 text-white font-black py-4 rounded-[2rem] uppercase italic flex items-center justify-center gap-2 text-lg active:scale-95 transition-all">
                            <RefreshCw size={20} /> REPETIR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerHome;