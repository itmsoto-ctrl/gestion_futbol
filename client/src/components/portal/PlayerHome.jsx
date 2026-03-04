import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';

const PlayerHome = () => {
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) { setLoading(false); return; }
                
                // 1. Cargar perfil
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`);
                const data = await res.json();
                if (data) {
                    setUser(data);
                    // 2. Cargar calendario si tiene equipo
                    if (data.team_id) {
                        const mRes = await fetch(`${API_BASE_URL}/api/leagues/my-calendar/${data.team_id}`);
                        const mData = await mRes.json();
                        setMatches(mData);
                    }
                }
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
                video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } } 
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

    const handleAccept = async () => {
        if (!tempPhoto) return;
        setUploading(true);
    
        try {
            // 1️⃣ Subida a Cloudinary
            const formData = new FormData();
            formData.append('file', tempPhoto);
            formData.append('upload_preset', 'vora_players');
    
            const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                method: 'POST',
                body: formData
            });
            const cloudData = await cloudRes.json();
            if (!cloudData.secure_url) throw new Error("Error en Cloudinary");
    
            // 2️⃣ Guardar URL en Base de Datos
            const response = await fetch(`${API_BASE_URL}/api/auth/update-photo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    photo_url: cloudData.secure_url
                })
            });
    
            if (response.ok) {
                setUser(prev => ({ ...prev, photo_url: cloudData.secure_url }));
                setTempPhoto(null);
            }
        } catch (err) {
            alert("Error al guardar la foto profesional.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic">PREPARANDO VESTUARIO...</div>;

    // --- VISTA A: CAPTURA (Cromo vacío o Preview) ---
    if (!user?.photo_url) {
        return (
            <div className="min-h-screen bg-[#665C5A] text-white flex flex-col items-center pt-10 px-6 relative overflow-hidden">
                <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer active:scale-95 transition-transform drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <FutCard 
                        player={{
                            name: user?.name || 'JUGADOR',
                            rating: 85,
                            photo_url: tempPhoto || null,
                            position: 'DEL',
                            pac: 80, sho: 85, pas: 72, dri: 84, def: 35, phy: 70
                        }} 
                    />
                </div>

                {!tempPhoto ? (
                    <div className="text-center mt-10 space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400 animate-pulse">Toca el cromo para entrar en la liga</p>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white/20">TU FICHA <br/> OFICIAL</h2>
                    </div>
                ) : (
                    <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex flex-col gap-3">
                        <button onClick={handleAccept} disabled={uploading} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl flex items-center justify-center gap-3">
                            {uploading ? <Loader2 className="animate-spin" /> : <>¡ESTÁ DE LOCOS! <Check/></>}
                        </button>
                        <button onClick={startCamera} className="w-full bg-white/10 backdrop-blur-md text-white font-black py-4 rounded-2xl uppercase italic border border-white/20">REPETIR FOTO</button>
                    </div>
                )}

                {/* Cámara Overlay */}
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-72 h-96 border-[3px] border-lime-400/50 border-dashed rounded-[50%_50%_45%_45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                            </div>
                            <button onClick={stopCamera} className="absolute top-6 right-6 text-white bg-black/50 p-3 rounded-full"><X /></button>
                        </div>
                        <div className="h-40 flex items-center justify-center bg-[#1a1a1a] border-t border-white/10">
                            <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
                                <Camera size={32} className="text-black" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VISTA B: HOME PREMIUM (Cromo con foto + Fondo Rojo + Calendario) ---
    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" 
             style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg"><Home size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Calendar size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Trophy size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><BarChart2 size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto"><Settings size={28} /></button>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-center relative px-6">
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse">
                        <UploadCloud size={24} />
                    </button>
                )}

                <div className="transform scale-[0.85] sm:scale-100 drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10 duration-700">
                    <FutCard player={user} />
                </div>

                <div className="mt-14 text-center space-y-4">
                    <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em]">Siguiente Encuentro</div>
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                            {matches[0]?.home_team || 'POR DEFINIR'} <span className="text-amber-400 text-2xl">VS</span> {matches[0]?.away_team || 'POR DEFINIR'}
                        </h2>
                        <div className="flex flex-col gap-1">
                            <p className="text-xl font-bold text-white/90">
                               {matches[0] ? new Date(matches[0].match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximamente'}
                            </p>
                            <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-400">
                               {matches[0]?.venue_name || 'ESTADIO VORA'} — {matches[0] ? new Date(matches[0].match_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '00:00H'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerHome;