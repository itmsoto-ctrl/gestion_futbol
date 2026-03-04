import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User, IdCard, Hash, Target, MapPin, ChevronRight } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import WelcomeTutorial from './WelcomeTutorial'; 

const PlayerHome = () => {
    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    
    // ESTADOS
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('HOME'); // 'HOME', 'CARD_MENU', 'CALENDAR', 'FORM'
    const [showTutorial, setShowTutorial] = useState(false);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '', dni: '', dorsal: '', position: 'DEL', country_code: 'es'
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
                    setFormData({
                        name: data.name || '',
                        dni: data.dni || '',
                        dorsal: data.dorsal || '',
                        position: data.position || 'DEL',
                        country_code: data.country_code || 'es'
                    });

                    // 🛠 LÓGICA DE NAVEGACIÓN "12:15H" RECUPERADA
                    if (!data.photo_url || data.photo_url === "" || data.photo_url === "null") {
                        const hasSeen = localStorage.getItem('tutorialSeen');
                        if (!hasSeen) setShowTutorial(true);
                        setView('CARD_MENU'); // Bloqueamos el Home si no hay foto
                    } else {
                        setView('HOME');
                    }

                    // CARGA DE CALENDARIO DEL EQUIPO
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

    const finishTutorial = () => {
        localStorage.setItem('tutorialSeen', 'true');
        setShowTutorial(false);
        if (!user?.photo_url) setView('CARD_MENU');
    };

    // --- FUNCIONES CÁMARA (Recuperadas de tu versión estable) ---
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

    const handleFinalUpdate = async () => {
        setUploading(true);
        try {
            let finalPhotoUrl = user.photo_url;
            if (tempPhoto) {
                const cloudFormData = new FormData();
                cloudFormData.append('file', tempPhoto);
                cloudFormData.append('upload_preset', 'vora_players'); 
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                    method: 'POST', body: cloudFormData
                });
                const cloudData = await cloudRes.json();
                finalPhotoUrl = cloudData.secure_url;
            }
            const response = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, photo_url: finalPhotoUrl, ...formData })
            });
            if (response.ok) {
                setUser(prev => ({ ...prev, photo_url: finalPhotoUrl, ...formData }));
                setTempPhoto(null);
                setView('HOME');
            }
        } catch (err) { alert(`Error: ${err.message}`); } finally { setUploading(false); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic tracking-widest uppercase">Preparando Vestuario...</div>;

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans italic" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* SIDEBAR */}
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button onClick={() => setView('HOME')} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === 'HOME' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30'}`}><Home size={28} /></button>
                <button onClick={() => setView('CALENDAR')} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${view === 'CALENDAR' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30'}`}><Calendar size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Trophy size={28} /></button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><BarChart2 size={28} /></button>
                <button onClick={() => setShowTutorial(true)} className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto active:scale-95"><Settings size={28} /></button>
            </aside>

            {showTutorial && <WelcomeTutorial user={user} onFinish={finishTutorial} />}

            <main className="flex-1 flex flex-col items-center justify-center relative px-6 overflow-y-auto pt-10 pb-10">
                
                {/* VISTA 1: HOME (PRÓXIMO PARTIDO) */}
                {view === 'HOME' && (
                    <div className="flex flex-col items-center justify-center w-full animate-in fade-in duration-700">
                        {showInstallBtn && (
                            <button onClick={handleInstallClick} className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse z-40">
                                <UploadCloud size={24} />
                            </button>
                        )}
                        <div onClick={() => setView('CARD_MENU')} className="cursor-pointer transform scale-[0.7] sm:scale-85 active:scale-95 transition-all drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)]">
                            <FutCard player={user} size="large" />
                            <div className="absolute -bottom-12 left-0 w-full text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">Toca para gestionar ficha</p>
                            </div>
                        </div>

                        {/* INFO PRÓXIMO PARTIDO (RECUPERADO 12:15H) */}
                        <div className="mt-20 text-center space-y-4 text-white">
                            <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase rounded-full tracking-[0.2em]">Siguiente Encuentro</div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
                                    {matches[0]?.home_team || 'POR DEFINIR'} <span className="text-amber-400 text-2xl font-black">VS</span> {matches[0]?.away_team || 'POR DEFINIR'}
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
                    </div>
                )}

                {/* VISTA 2: CALENDARIO DE EQUIPO (OBJETIVO DE HOY) */}
                {view === 'CALENDAR' && (
                    <div className="w-full max-w-md animate-in slide-in-from-right duration-500 space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-black uppercase italic text-lime-400">Mi Calendario</h2>
                            <p className="text-[10px] uppercase font-bold text-white/30 tracking-widest">{user?.team_name}</p>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
                            {matches.length > 0 ? matches.map((m, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-lime-400 uppercase tracking-tighter">{new Date(m.match_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} — {new Date(m.match_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-lg font-black text-white leading-none mt-1 uppercase tracking-tighter">{m.home_team} VS {m.away_team}</p>
                                        <p className="text-[10px] font-bold text-white/30 uppercase mt-1 flex items-center gap-1"><MapPin size={10}/> {m.venue_name}</p>
                                    </div>
                                    <ChevronRight className="text-white/20" />
                                </div>
                            )) : (
                                <p className="text-center text-white/20 font-bold uppercase py-10">No hay partidos programados</p>
                            )}
                        </div>
                        <button onClick={() => setView('HOME')} className="w-full py-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Volver al inicio</button>
                    </div>
                )}

                {/* VISTAS RESTANTES (CARD_MENU, FORM, ETC) SIN CAMBIOS PARA SEGURIDAD */}
                {view === 'CARD_MENU' && (
                    <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                         <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer active:scale-95 transition-transform drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform scale-[0.8]">
                            <FutCard player={{ ...user, name: formData.name, photo_url: tempPhoto || user?.photo_url, position: formData.position }} />
                        </div>
                        {!tempPhoto ? (
                            <div className="flex flex-col w-full gap-4 mt-8 max-w-xs">
                                <button onClick={() => setView('FORM')} className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl uppercase italic text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    <User size={18} className="text-lime-400"/> GESTIONAR DATOS
                                </button>
                                <button onClick={() => setView('HOME')} className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver al inicio</button>
                            </div>
                        ) : (
                            <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex flex-col gap-3 max-w-md mx-auto">
                                <button onClick={() => setView('FORM')} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl flex items-center justify-center gap-3 active:scale-95">¡ESTÁ DE LOCOS! <Check/></button>
                                <button onClick={startCamera} className="w-full bg-white/5 text-white/40 font-black py-4 rounded-2xl uppercase italic text-[10px]">REPETIR FOTO</button>
                            </div>
                        )}
                    </div>
                )}

                {view === 'FORM' && (
                    <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="text-center"><h2 className="text-2xl font-black uppercase italic text-lime-400 leading-none">Datos de Ficha</h2></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nombre en Carta</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white transition-all" />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">DNI / Documento</label>
                                <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Dorsal</label>
                                <input type="text" value={formData.dorsal} readOnly className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 font-black text-lime-400 opacity-50 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-white/40 ml-2">Posición</label>
                                <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold outline-none text-white">
                                    <option value="PO" className="bg-[#1a1a1a]">PO</option>
                                    <option value="DFC" className="bg-[#1a1a1a]">DFC</option>
                                    <option value="MC" className="bg-[#1a1a1a]">MC</option>
                                    <option value="DEL" className="bg-[#1a1a1a]">DEL</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-6">
                            <button onClick={handleFinalUpdate} disabled={uploading || !formData.name} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl flex items-center justify-center gap-3">
                                {uploading ? <Loader2 className="animate-spin" /> : "CONFIRMAR FICHA"}
                            </button>
                            <button onClick={() => setView('CARD_MENU')} className="w-full mt-2 py-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver al inicio</button>
                        </div>
                    </div>
                )}

                {/* OVERLAY CÁMARA */}
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[120] bg-black flex flex-col animate-in fade-in duration-300">
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-72 h-96 border-[3px] border-lime-400/50 border-dashed rounded-[50%_50%_45%_45%] shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
                            </div>
                            <button onClick={stopCamera} className="absolute top-6 right-6 text-white bg-black/50 p-3 rounded-full"><X /></button>
                        </div>
                        <div className="h-40 flex items-center justify-center bg-zinc-950">
                            <button onClick={capturePhoto} className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all"><Camera size={32} className="text-black" /></button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PlayerHome;