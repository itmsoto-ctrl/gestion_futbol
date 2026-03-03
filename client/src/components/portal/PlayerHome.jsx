import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 

const PlayerHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);

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
                if (data.exists) setUser(data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchUserData();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setTempPhoto(null);
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { alert("Error cámara"); setIsCameraOpen(false); }
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
            setTempPhoto(canvasRef.current.toDataURL('image/jpeg', 0.8));
            stopCamera();
        }
    };

    const handleAccept = () => {
        setUser(prev => ({ ...prev, photo_url: tempPhoto }));
        setTempPhoto(null);
    };

    if (loading) return <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-lime-400">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[#665C5A] text-white flex flex-col items-center pt-10 relative">
            <div className="fixed top-0 left-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 font-mono">V-IOS-BG-METHOD-07</div>

            <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer">
                <FutCard 
                    key={user?.photo_url || tempPhoto || 'empty'} 
                    player={{
                        name: user?.name || 'JUGADOR',
                        rating: 85,
                        photo_url: tempPhoto || user?.photo_url,
                        pac: 80, sho: 85, pas: 72, dri: 84, def: 35, phy: 70
                    }} 
                />
            </div>

            {/* 🔘 BOTONES FLOTANTES DE CONFIRMACIÓN */}
{tempPhoto && (
    <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-10">
        <button 
            onClick={handleAccept} 
            className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-[0_10px_30px_rgba(163,230,53,0.5)] active:scale-95 transition-all"
        >
            ¡ESTÁ DE LOCOS!
        </button>
        <button 
            onClick={startCamera} 
            className="w-full bg-white/20 backdrop-blur-md text-white font-black py-4 rounded-2xl uppercase italic border border-white/20 active:scale-95 transition-all"
        >
            REPETIR SELFIE
        </button>
    </div>
)}

            {/* BOTONES TRAS CAPTURA */}
            {tempPhoto && (
                <div className="mt-8 flex flex-col gap-3 w-full max-w-[280px]">
                    <button onClick={handleAccept} className="w-full bg-lime-400 text-black font-black py-4 rounded-2xl uppercase italic flex items-center justify-center gap-2">
                        <Check size={20} /> ¡ESTÁ DE LOCOS!
                    </button>
                    <button onClick={startCamera} className="w-full bg-white/10 text-white font-black py-4 rounded-2xl uppercase italic flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> REPETIR
                    </button>
                </div>
            )}

            {/* CÁMARA */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    <div className="relative flex-1 bg-black flex items-center justify-center">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-72 h-96 border-[3px] border-lime-400/50 border-dashed rounded-[50%_50%_45%_45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                        </div>
                        <button onClick={stopCamera} className="absolute top-6 right-6 text-white"><X /></button>
                    </div>
                    <div className="h-32 flex items-center justify-center bg-[#1a1a1a]">
                        <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center"><Camera size={32} className="text-black" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PlayerHome;