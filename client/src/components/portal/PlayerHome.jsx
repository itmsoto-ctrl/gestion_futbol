import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User, Target, MapPin, RefreshCw, ChevronLeft } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';

const PlayerHome = () => {
    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    
    // ESTADOS
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // Controla si estamos en el "menú futcard"
    const [isFlipped, setIsFlipped] = useState(false); // Controla el giro 3D
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);
    
    const [editData, setEditData] = useState({ name: '', position: 'DEL', country: 'es' });

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
                    
                    // LÓGICA DE ENTRADA: Si no tiene foto, entra directo a editar
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

    // --- LÓGICA DE CÁMARA (Sin cambios) ---
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
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', { method: 'POST', body: formData });
                const cloudData = await cloudRes.json();
                finalPhotoUrl = cloudData.secure_url;
            }
            const response = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email, photo_url: finalPhotoUrl,
                    name: editData.name, position: editData.position, country_code: editData.country
                })
            });
            if (response.ok) {
                setUser({ ...user, photo_url: finalPhotoUrl, name: editData.name, position: editData.position, country_code: editData.country });
                setTempPhoto(null);
                setIsEditing(false); // Al guardar volvemos al Home
                setIsFlipped(false);
            }
        } catch (err) { alert("Error al guardar."); } finally { setUploading(false); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic tracking-widest uppercase">Preparando Vestuario...</div>;

    // --- VISTA A: MENÚ FUTCARD (Registro / Edición) ---
    if (isEditing) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center pt-10 px-6 relative overflow-x-hidden">
                
                {/* Botón Volver (Solo si ya tiene foto, para no quedarse atrapado) */}
                {user?.photo_url && (
                    <button onClick={() => setIsEditing(false)} className="absolute top-6 left-6 text-white/40 flex items-center gap-2 font-black uppercase italic text-xs tracking-widest">
                        <ChevronLeft size={16}/> Volver
                    </button>
                )}

                {/* 📝 LEYENDA SUPERIOR (Tu petición) */}
                <div className="text-center mb-8 space-y-2 animate-in fade-in duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400 italic">
                        Pulsa para la foto
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                        Gira la tarjeta para tus datos
                    </p>
                </div>

                {/* CONTENEDOR DE LA CARTA (Corregido para evitar cortes en el giro) */}
                <div className="relative z-10 perspective-2000 py-4">
                    <div className="transform scale-[0.7] sm:scale-100 transition-all duration-500">
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
                            {/* REVERSO: Formulario */}
                            <div className="w-full h-full flex flex-col p-8 space-y-5 pt-12 text-amber-950 font-sans">
                                <h3 className="font-black italic uppercase tracking-widest text-center">Ficha Técnica</h3>
                                <div className="h-[2px] w-12 bg-amber-950/20 mx-auto" />
                                
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black opacity-40 uppercase ml-1">Nombre</label>
                                    <input type="text" maxLength={12} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 font-bold uppercase outline-none focus:border-amber-950/30" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black opacity-40 uppercase ml-1">Posición</label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {['PO', 'DFC', 'MC', 'DEL'].map(pos => (
                                            <button key={pos} onClick={() => setEditData({...editData, position: pos})} className={`py-2 rounded-lg font-black text-[10px] ${editData.position === pos ? 'bg-amber-950 text-white' : 'bg-amber-950/5'}`}>{pos}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black opacity-40 uppercase ml-1">País</label>
                                    <select value={editData.country} onChange={(e) => setEditData({...editData, country: e.target.value})} className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 font-bold uppercase outline-none appearance-none">
                                        <option value="es">España 🇪🇸</option>
                                        <option value="ar">Argentina 🇦🇷</option>
                                        <option value="br">Brasil 🇧🇷</option>
                                    </select>
                                </div>

                                <button onClick={handleAccept} disabled={uploading || !editData.name} className="w-full bg-amber-950 text-white font-black py-4 rounded-xl uppercase italic text-sm shadow-xl active:scale-95 transition-all">
                                    {uploading ? <Loader2 className="animate-spin mx-auto" /> : "Guardar Ficha"}
                                </button>
                            </div>
                        </FutCard>
                    </div>

                    {/* Botón Flotante: Selfie (Front) */}
                    {!isFlipped && (
                        <button onClick={startCamera} className="absolute -left-4 top-1/2 -translate-y-1/2 bg-lime-400 text-black p-4 rounded-full shadow-2xl z-50 animate-bounce">
                            <Camera size={24} />
                        </button>
                    )}

                    {/* Botón Flotante: Girar (Flip) */}
                    <button onClick={() => setIsFlipped(!isFlipped)} className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white text-black p-4 rounded-full shadow-2xl z-50 hover:rotate-180 transition-transform duration-500">
                        <RefreshCw size={24} />
                    </button>
                </div>

                {/* Cámara Overlay */}
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[150] bg-black flex flex-col animate-in fade-in duration-300">
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-72 h-96 border-[3px] border-lime-400/50 border-dashed rounded-[50%_50%_45%_45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                            </div>
                            <button onClick={stopCamera} className="absolute top-8 right-8 text-white bg-black/50 p-3 rounded-full"><X /></button>
                        </div>
                        <div className="h-40 flex items-center justify-center bg-zinc-950 border-t border-white/5">
                            <button onClick={capturePhoto} className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all border-8 border-white/10">
                                <Camera size={38} className="text-black" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- VISTA B: HOME PREMIUM ---
    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg"><Home size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Calendar size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Trophy size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><BarChart2 size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto"><Settings size={28} /></button>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-center relative px-6 pt-10 pb-10">
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white z-40">
                        <UploadCloud size={24} />
                    </button>
                )}

                {/* Al pulsar la carta en el Home, entramos en modo edición */}
                <div onClick={() => setIsEditing(true)} className="cursor-pointer transform scale-[0.7] sm:scale-85 active:scale-95 transition-all drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10">
                    <FutCard player={user} size="large" />
                    <div className="absolute -bottom-12 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">
                            Toca para editar tu ficha
                        </p>
                    </div>
                </div>

                <div className="mt-20 text-center space-y-4">
                    <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em]">Siguiente Encuentro</div>
                    <div className="space-y-2 text-white">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                            {matches[0]?.home_team || 'POR DEFINIR'} <span className="text-amber-400 text-2xl">VS</span> {matches[0]?.away_team || 'POR DEFINIR'}
                        </h2>
                        <p className="text-xl font-bold opacity-90">{matches[0] ? new Date(matches[0].match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximamente'}</p>
                        <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-400">{matches[0]?.venue_name || 'ESTADIO VORA'}</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerHome;