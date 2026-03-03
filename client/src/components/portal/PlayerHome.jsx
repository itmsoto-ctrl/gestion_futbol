import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, ShieldCheck } from 'lucide-react';
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { alert("Error de cámara"); setIsCameraOpen(false); }
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
            const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
            
            // DIRECTO A LA TARJETA:
            setUser(prev => ({ ...prev, photo_url: imageDataUrl }));
            stopCamera();
            setShowPromoModal(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#665C5A] flex items-center justify-center text-lime-400 font-black italic">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[#665C5A] text-white relative overflow-x-hidden pb-10">
            <div className="fixed top-0 left-0 z-[9999] bg-red-600 text-white text-[10px] px-2 py-1 font-mono">V-DIRECT-PHOTO-04</div>

            <div className="p-6 flex flex-col items-center pt-10">
                <div onClick={() => !user?.photo_url && setShowPromoModal(true)} className="cursor-pointer">
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
            </div>

            {/* MODAL PROMO */}
            {showPromoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-[#2a2a2a] rounded-[2.5rem] p-8 text-center border border-white/10 w-full max-w-md">
                        <h2 className="text-3xl font-black italic uppercase mb-6">Tu Carta VORA</h2>
                        <button onClick={startCamera} className="w-full bg-lime-400 text-black font-black py-5 rounded-[2rem] uppercase italic">¡HACERME EL SELFIE!</button>
                    </div>
                </div>
            )}

            {/* MODAL CÁMARA */}
            {isCameraOpen && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        <button onClick={stopCamera} className="absolute top-6 right-6 text-white bg-black/50 p-3 rounded-full"><X /></button>
                    </div>
                    <div className="h-32 bg-[#1a1a1a] flex items-center justify-center">
                        <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center"><Camera size={32} className="text-black" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default PlayerHome;