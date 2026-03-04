import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User, Target, MapPin, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';

const PlayerHome = () => {
    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);
    
    // --- ESTADO 3D FLIP ---
    const [isFlipped, setIsFlipped] = useState(false);
    
    // --- ESTADO EDICIÓN ---
    const [editData, setEditData] = useState({
        name: '',
        position: 'DEL',
        country: 'es'
    });

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
                    setEditData({
                        name: data.name || '',
                        position: data.position || 'DEL',
                        country: data.country_code || 'es'
                    });
                    // Si no tiene foto, lo mandamos directo al reverso para que empiece
                    if (!data.photo_url) setIsFlipped(true);

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

    const startCamera = () => {
        setTempPhoto(null);
        setIsCameraOpen(true);
        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } } 
                });
                streamRef.current = stream;
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) { alert("Error cámara"); setIsCameraOpen(false); }
        }, 100);
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
        setUploading(true);
        try {
            let finalPhotoUrl = user.photo_url;

            if (tempPhoto) {
                const formData = new FormData();
                formData.append('file', tempPhoto);
                formData.append('upload_preset', 'vora_players'); 
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();
                finalPhotoUrl = cloudData.secure_url;
            }
    
            const response = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    photo_url: finalPhotoUrl,
                    name: editData.name,
                    position: editData.position,
                    country_code: editData.country
                })
            });
    
            if (response.ok) {
                setUser({ ...user, photo_url: finalPhotoUrl, name: editData.name, position: editData.position, country_code: editData.country });
                setTempPhoto(null);
                setIsFlipped(false); // Volvemos al frente al terminar
            }
        } catch (err) {
            alert("Error al guardar la ficha oficial.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic">PREPARANDO VESTUARIO...</div>;

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" 
             style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* --- SIDEBAR IZQUIERDA --- */}
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg"><Home size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Calendar size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Trophy size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><BarChart2 size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto"><Settings size={28} /></button>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-6 overflow-y-auto">
                
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse z-40">
                        <UploadCloud size={24} />
                    </button>
                )}

                {/* --- LA CARTA CON GIRO 3D --- */}
                <div className="relative group perspective-1000 transform scale-[0.7] sm:scale-90 animate-in zoom-in duration-700">
                    <FutCard 
                        player={{
                            ...user,
                            name: editData.name.toUpperCase() || 'JUGADOR',
                            photo_url: tempPhoto || user?.photo_url,
                            position: editData.position,
                            country_code: editData.country
                        }} 
                        isFlipped={isFlipped}
                        size="large"
                    >
                        {/* CONTENIDO DEL REVERSO (FICHA TÉCNICA) */}
                        <div className="w-full h-full flex flex-col p-8 space-y-6 pt-12">
                            <div className="text-center">
                                <h3 className="text-amber-950 font-black italic uppercase tracking-widest">Ficha Técnica</h3>
                                <div className="h-[2px] w-12 bg-amber-950/20 mx-auto mt-1" />
                            </div>

                            {/* Foto / Selfie */}
                            <div onClick={startCamera} className="w-24 h-24 bg-amber-950/5 border-2 border-dashed border-amber-950/20 rounded-full mx-auto flex items-center justify-center cursor-pointer active:scale-95 transition-all overflow-hidden relative">
                                {tempPhoto || user?.photo_url ? (
                                    <img src={tempPhoto || user?.photo_url} className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="text-amber-950/40" size={32} />
                                )}
                            </div>

                            {/* Nombre */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-amber-950/40 uppercase tracking-tighter ml-1">Nombre en Carta</label>
                                <input 
                                    type="text" maxLength={12} value={editData.name}
                                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 text-amber-950 font-bold uppercase outline-none focus:border-amber-950/30"
                                />
                            </div>

                            {/* Posición */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-amber-950/40 uppercase tracking-tighter ml-1">Posición</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {['PO', 'DFC', 'MC', 'DEL'].map(pos => (
                                        <button 
                                            key={pos} onClick={() => setEditData({...editData, position: pos})}
                                            className={`py-2 rounded-lg font-black text-[10px] transition-all ${editData.position === pos ? 'bg-amber-950 text-white' : 'bg-amber-950/5 text-amber-950/40'}`}
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Nacionalidad */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-amber-950/40 uppercase tracking-tighter ml-1">Nacionalidad</label>
                                <select 
                                    value={editData.country} onChange={(e) => setEditData({...editData, country: e.target.value})}
                                    className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 text-amber-950 font-bold uppercase outline-none appearance-none"
                                >
                                    <option value="es">España 🇪🇸</option>
                                    <option value="ar">Argentina 🇦🇷</option>
                                    <option value="br">Brasil 🇧🇷</option>
                                    <option value="fr">Francia 🇫🇷</option>
                                    <option value="it">Italia 🇮🇹</option>
                                </select>
                            </div>

                            <button 
                                onClick={handleAccept} disabled={uploading || !editData.name}
                                className="w-full bg-amber-950 text-white font-black py-4 rounded-xl uppercase italic text-sm shadow-lg active:scale-95 transition-all disabled:opacity-20"
                            >
                                {uploading ? <Loader2 className="animate-spin mx-auto" /> : "GUARDAR FICHA"}
                            </button>
                        </div>
                    </FutCard>

                    {/* Botón Flotante para girar la tarjeta */}
                    <button 
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="absolute -right-4 top-1/2 -translate-y-1/2 bg-lime-400 text-black p-4 rounded-full shadow-xl z-50 active:rotate-180 transition-transform duration-500"
                    >
                        <RefreshCw size={24} />
                    </button>
                </div>

                {/* --- SECCIÓN SIGUIENTE PARTIDO --- */}
                {!isFlipped && (
                    <div className="mt-12 text-center space-y-4 animate-in fade-in duration-1000">
                        <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em]">Siguiente Encuentro</div>
                        <div className="space-y-2 text-white">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                                {matches[0]?.home_team || 'POR DEFINIR'} <span className="text-amber-400 text-2xl">VS</span> {matches[0]?.away_team || 'POR DEFINIR'}
                            </h2>
                            <p className="text-xl font-bold opacity-90">{matches[0] ? new Date(matches[0].match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximamente'}</p>
                            <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-400">{matches[0]?.venue_name || 'ESTADIO VORA'}</p>
                        </div>
                    </div>
                )}

                {/* --- OVERLAY CÁMARA --- */}
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
                            <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                                <Camera size={32} className="text-black" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PlayerHome;