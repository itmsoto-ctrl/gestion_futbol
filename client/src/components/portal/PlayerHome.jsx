import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ShieldCheck, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 

const PlayerHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) { setLoading(false); return; }
                const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: savedEmail })
                });
                const data = await res.json();
                if (data.exists) {
                    setUser(data);
                    if (!data.photo_url) setTimeout(() => setShowPromoModal(true), 1000);
                }
            } catch (err) { console.error("Error:", err); } finally { setLoading(false); }
        };
        fetchUserData();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setShowPromoModal(false);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } } 
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { 
            alert("Error al acceder a la cámara. Asegúrate de dar permisos."); 
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
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
            
            // Inyectamos la foto directamente en el estado
            setUser(prev => ({ ...prev, photo_url: imageDataUrl }));
            stopCamera();
        }
    };

    if (loading) return <div className="min-h-screen bg-[#665C5A] flex items-center justify-center text-lime-400 font-black italic uppercase">Cargando vestuario...</div>;

    return (
        <div className="min-h-screen bg-[#665C5A] text-white font-sans relative overflow-x-hidden pb-10">
            {/* MARCA DE AGUA */}
            <div className="fixed top-0 left-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 font-mono font-bold">V-PRO-INTERFACE-05</div>

            <div className="p-6 flex flex-col items-center pt-10">
                <div onClick={() => startCamera()} className="cursor-pointer active:scale-95 transition-transform">
                    <FutCard 
                        key={user?.photo_url || 'empty'} 
                        player={{
                            name: user?.name || 'JUGADOR',
                            rating: 85,
                            photo_url: user?.photo_url,
                            pac: 80, sho: 85, pas: 72, dri: 84, def: 35, phy: 70
                        }} 
                        size="large" 
                    />
                </div>
                
                {/* 📝 LEYENDA DINÁMICA */}
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-lime-400 animate-pulse text-center">
                    {user?.photo_url ? "Toca la carta para repetir tu selfie" : "Toca la carta para añadir tu foto"}
                </p>

                {/* 🔄 BOTÓN ADICIONAL */}
                {user?.photo_url && (
                    <button 
                        onClick={startCamera}
                        className="mt-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-8 py-4 rounded-full border border-white/20 transition-all active:scale-95"
                    >
                        <RefreshCw size={18} className="text-lime-400" />
                        <span className="text-sm font-bold uppercase italic tracking-tighter">Cambiar mi foto</span>
                    </button>
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

            {/* MODAL CÁMARA CON GUÍA VISUAL */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* 🎯 GUÍA DE LA CARA (ÓVALO FIFA STYLE) */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-72 h-96 border-[3px] border-lime-400/50 border-dashed rounded-[50%_50%_45%_45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lime-400/40 text-[10px] font-black uppercase tracking-widest">Encaja tu rostro aquí</div>
                            </div>
                        </div>

                        <button onClick={stopCamera} className="absolute top-6 right-6 text-white bg-black/50 p-3 rounded-full"><X /></button>
                    </div>
                    <div className="h-44 bg-[#1a1a1a] flex flex-col items-center justify-center border-t border-white/10 pb-8">
                        <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full border-4 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(163,230,53,0.4)] active:scale-90 transition-all">
                            <Camera size={32} className="text-black" />
                        </button>
                        <p className="mt-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Capturar cromo</p>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PlayerHome;