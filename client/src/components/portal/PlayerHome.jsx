import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import ProfileWizard from './ProfileWizard'; // <--- Tu nuevo componente

const PlayerHome = () => {
    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);

    // --- NUEVA LÓGICA: ESTADO DE EDICIÓN ---
    const [isEditing, setIsEditing] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) { setLoading(false); return; }
                
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`);
                const data = await res.json();
                if (data) {
                    setUser(data);
                    // Si el usuario no tiene foto, activamos el modo edición/registro por defecto
                    if (!data.photo_url) setIsEditing(true);

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

    // --- ACTUALIZADO: handleAccept ahora recibe los datos del Wizard ---
    const handleAccept = async (editData = {}) => {
        setUploading(true);
        try {
            let finalPhotoUrl = user.photo_url;

            // 1. Subida de foto si hay una nueva captura
            if (tempPhoto) {
                const formData = new FormData();
                formData.append('file', tempPhoto);
                formData.append('upload_preset', 'vora_players'); 
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();
                if (!cloudData.secure_url) throw new Error("Error Cloudinary");
                finalPhotoUrl = cloudData.secure_url;
            }
    
            // 2. Guardar en Base de Datos (Foto + Datos del reverso)
            const savedEmail = localStorage.getItem('userEmail');
            const response = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: savedEmail,
                    photo_url: finalPhotoUrl,
                    name: editData.name || user.name,
                    position: editData.position || user.position,
                    country_code: editData.country || user.country_code
                })
            });
    
            if (response.ok) {
                setUser(prev => ({ 
                    ...prev, 
                    photo_url: finalPhotoUrl,
                    name: editData.name || prev.name,
                    position: editData.position || prev.position,
                    country_code: editData.country || prev.country_code
                }));
                setTempPhoto(null);
                setIsEditing(false); // <--- Cerramos el modo edición tras guardar
                alert("¡Ficha oficial guardada! 🚀");
            }
        } catch (err) {
            alert(`🚨 Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic">PREPARANDO VESTUARIO...</div>;

    // --- VISTA A: REGISTRO / EDICIÓN (ProfileWizard) ---
    // Se muestra si no hay foto o si el usuario pulsó para editar
    if (isEditing) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center pt-10 px-6 relative overflow-hidden">
                <ProfileWizard 
                    user={user} 
                    tempPhoto={tempPhoto} 
                    onStartCamera={startCamera} 
                    onSave={handleAccept} 
                    uploading={uploading}
                    onCancel={() => user?.photo_url && setIsEditing(false)}
                />

                {/* Cámara Overlay (se mantiene en PlayerHome para no duplicar lógica) */}
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
                        <div className="h-40 flex items-center justify-center bg-zinc-950 border-t border-white/5">
                            <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all">
                                <Camera size={32} className="text-black" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VISTA B: HOME PREMIUM (Si ya tiene foto y no está editando) ---
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

            <main className="flex-1 flex flex-col items-center justify-center relative px-6 overflow-y-auto pt-10 pb-10">
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse z-40">
                        <UploadCloud size={24} />
                    </button>
                )}

                {/* ESCALADO 0.7 Y CLIC PARA EDITAR FICHA COMPLETA */}
                <div 
                    onClick={() => setIsEditing(true)} 
                    className="cursor-pointer transform scale-[0.7] sm:scale-85 active:scale-95 transition-all drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10 duration-700"
                >
                    <FutCard player={user} size="large" />
                    <div className="absolute -bottom-12 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">
                            Toca para editar tu ficha técnica
                        </p>
                    </div>
                </div>

                <div className="mt-20 text-center space-y-4">
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