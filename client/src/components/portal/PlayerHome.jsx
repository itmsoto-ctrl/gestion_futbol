import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User, Target, MapPin } from 'lucide-react';
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
    
    // ESTADO PARA LA EDICIÓN DE DATOS
    const [isEditing, setIsEditing] = useState(false);
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
                    // Cargamos los datos actuales en el formulario
                    setEditData({
                        name: data.name || '',
                        position: data.position || 'DEL',
                        country: data.country_code || 'es'
                    });
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

            // 1. Si hay foto nueva, se sube a Cloudinary
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
    
            // 2. Guardamos TODO el paquete en la DB
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
                setIsEditing(false);
            }
        } catch (err) {
            alert("Error al guardar la ficha oficial.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic">PREPARANDO VESTUARIO...</div>;

    // --- VISTA A: CONFIGURACIÓN / SELFIE (Si no tiene foto o está editando) ---
    if (!user?.photo_url || isEditing || tempPhoto) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-6 px-6 overflow-y-auto pb-10">
                
                {/* PREVIEW DINÁMICA DE LA CARTA */}
                <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer transform scale-[0.6] mb-[-60px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <FutCard 
                        player={{
                            ...user,
                            name: editData.name.toUpperCase() || 'JUGADOR',
                            photo_url: tempPhoto || user?.photo_url,
                            position: editData.position,
                            country_code: editData.country
                        }} 
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {!tempPhoto && !user?.photo_url && <Camera className="text-white/20" size={60} />}
                    </div>
                </div>

                {/* PANEL DE EDICIÓN ESTILO GLASS */}
                <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                    <div className="text-center space-y-1">
                        <h3 className="font-black italic uppercase text-xs tracking-[0.4em] text-lime-400">Ficha Técnica</h3>
                        <p className="text-[10px] text-white/20 uppercase font-bold">Personaliza tu presencia en la liga</p>
                    </div>

                    {/* Input Nombre */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase ml-2"><User size={12}/> Nombre del Jugador</label>
                        <input 
                            type="text" 
                            maxLength={12}
                            value={editData.name}
                            onChange={(e) => setEditData({...editData, name: e.target.value})}
                            placeholder="EJ: DANI"
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-6 font-bold uppercase outline-none focus:border-lime-400 text-white transition-all"
                        />
                    </div>

                    {/* Botones Posición */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase ml-2"><Target size={12}/> Posición Campo</label>
                        <div className="grid grid-cols-4 gap-2">
                            {['PO', 'DFC', 'MC', 'DEL'].map(pos => (
                                <button 
                                    key={pos}
                                    onClick={() => setEditData({...editData, position: pos})}
                                    className={`py-3 rounded-xl font-black text-xs transition-all ${editData.position === pos ? 'bg-lime-400 text-black scale-105 shadow-lg shadow-lime-400/20' : 'bg-white/5 text-white/20'}`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selector País */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase ml-2"><MapPin size={12}/> Nacionalidad</label>
                        <select 
                            value={editData.country}
                            onChange={(e) => setEditData({...editData, country: e.target.value})}
                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-6 font-bold uppercase outline-none appearance-none text-white focus:border-lime-400"
                        >
                            <option value="es">España 🇪🇸</option>
                            <option value="ar">Argentina 🇦🇷</option>
                            <option value="br">Brasil 🇧🇷</option>
                            <option value="fr">Francia 🇫🇷</option>
                            <option value="it">Italia 🇮🇹</option>
                            <option value="gb">Reino Unido 🇬🇧</option>
                        </select>
                    </div>

                    {/* Acciones */}
                    <div className="pt-2 space-y-3">
                        <button onClick={handleAccept} disabled={uploading || !editData.name} className="w-full bg-lime-400 text-black font-black py-5 rounded-[2rem] uppercase italic text-lg flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-20">
                            {uploading ? <Loader2 className="animate-spin" /> : <>GUARDAR FICHA <Check/></>}
                        </button>
                        {(tempPhoto || isEditing) && (
                            <button onClick={() => { setTempPhoto(null); setIsEditing(false); startCamera(); }} className="w-full bg-white/5 text-white/40 font-black py-4 rounded-[2rem] uppercase italic text-xs hover:text-white transition-colors">
                                Repetir Fotografía
                            </button>
                        )}
                    </div>
                </div>

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
                        <div className="h-40 flex items-center justify-center bg-zinc-950 border-t border-white/5">
                            <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all">
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

                {/* ESCALADO 0.7 Y CLIC PARA ENTRAR EN MODO EDICIÓN */}
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