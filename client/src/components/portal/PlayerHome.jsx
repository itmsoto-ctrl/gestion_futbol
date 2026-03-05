import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, Users, BarChart2, Settings, Loader2, UploadCloud, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import WelcomeTutorial from './WelcomeTutorial';
import InfoCenter from '../player/InfoCenter'; 
import StandingsModal from '../player/StandingsModal';
import CalendarModal from '../player/CalendarModal'; // ✅ Importamos el nuevo componente
import useInteractionSounds from '../../hooks/useInteractionSounds';
import RosterModal from '../player/RosterModal';

const PlayerHome = () => {
    const { playClick, playSwipe } = useInteractionSounds();

    const handleConfirm = () => {
        playClick();
        if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
        handleFinalUpdate();
    };

    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('HOME'); 
    const [showTutorial, setShowTutorial] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const [modalView, setModalView] = useState(null); 
    const [standings, setStandings] = useState([]);
    
    const [formData, setFormData] = useState({
        name: '', dni: '', dorsal: '', position: 'DEL', country_code: 'es'
    });

    const [matches, setMatches] = useState([]);
    const [roster, setRoster] = useState([]);
    const videoRef = useRef(null);
    const canvasRef = useRef(null); 
    const streamRef = useRef(null);

    const calculateStandings = (matchesData) => {
        const table = {};
        matchesData.forEach(m => {
            [m.home_team, m.away_team].forEach(t => {
                if (!table[t]) table[t] = { name: t, pj: 0, pts: 0, gf: 0, gc: 0 };
            });
            if (m.home_team_goals !== null && m.home_team_goals !== undefined) {
                const h = table[m.home_team];
                const a = table[m.away_team];
                h.pj++; a.pj++;
                h.gf += m.home_team_goals; h.gc += m.away_team_goals;
                a.gf += m.away_team_goals; a.gc += m.home_team_goals;
                if (m.home_team_goals > m.away_team_goals) h.pts += 3;
                else if (m.home_team_goals < m.away_team_goals) a.pts += 3;
                else { h.pts += 1; a.pts += 1; }
            }
        });
        return Object.values(table).sort((a,b) => b.pts - a.pts || (b.gf-b.gc) - (a.gf-a.gc));
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) { setLoading(false); return; }
                
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`);
                const data = await res.json();

                if (data) {
                    const statsBase = data.stats ? 
                        (typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats) : 
                        { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
                    
                    setUser({ ...data, stats: statsBase });
                    setFormData({
                        name: data.name || '',
                        dni: data.dni || '',
                        dorsal: data.dorsal || '',
                        position: data.position || 'DEL',
                        country_code: data.country_code || 'es'
                    });

                    if (data.is_pwa === 0 || data.tutorial_seen === 0) {
                        setShowTutorial(true); 
                        setView('SELFIE'); 
                    } else if (!data.photo_url) {
                        setView('SELFIE'); 
                    } else {
                        setView('HOME'); 
                    }

                    if (data.team_id) {
                        

                        const mRes = await fetch(`${API_BASE_URL}/api/leagues/my-calendar/${data.team_id}`);
                        const mData = await mRes.json();
                        setMatches(mData);
                        setStandings(calculateStandings(mData));

                        // 2. Plantilla (Copia y pega este bloque exacto)
                        try {
                            const rosterUrl = `${API_BASE_URL}/api/leagues/teams/${data.team_id}/players`;
                            console.log("🌐 Intentando cargar plantilla desde:", rosterUrl);

                            const rRes = await fetch(rosterUrl);
                            
                            if(rRes.ok) {
                                const rData = await rRes.json();
                                console.log("✅ Jugadores cargados:", rData);
                                setRoster(rData);
                            } else {
                                const errorText = await rRes.text();
                                console.error("❌ Error en la respuesta del servidor:", rRes.status, errorText);
                            }
                        } catch(err) { 
                            console.error("❌ Error de red o conexión cargando plantilla:", err); 
                        }


                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchUserData();
        return () => stopCamera();
    }, []);

    const finishTutorial = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/auth/complete-tutorial`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email })
            });
            setShowTutorial(false);
        } catch (err) { console.error(err); }
    };

    const startCamera = async () => {
        setTempPhoto(null); 
        setIsCameraOpen(true);
        
        // 1. Limpieza de seguridad (Evita que la cámara se quede "bloqueada" por un intento previo)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    
        // 2. Configuración híbrida (Equilibrio entre resolución y compatibilidad)
        const constraints = {
            video: {
                facingMode: "user", // "user" para la frontal. En Android e iOS es la clave.
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false // Importante: No pedir micro reduce errores de permisos
        };
    
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                
                // 3. El "Trick" para iOS y navegadores estrictos
                // Forzamos el play() y capturamos si el sistema intenta bloquearlo
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error("Error en autoplay (posible bloqueo de ahorro de energía):", error);
                    });
                }
            }
        } catch (err) {
            console.error("Error acceso cámara:", err);
            // Plan B: Si falla por la resolución, intentamos lo más básico posible
            try {
                const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
                streamRef.current = basicStream;
                if (videoRef.current) videoRef.current.srcObject = basicStream;
            } catch (finalErr) {
                alert("⚠️ Error de cámara: Asegúrate de dar permisos en los ajustes del navegador y de no tener el modo 'Ahorro de batería' activado.");
                setIsCameraOpen(false);
            }
        }
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            setTempPhoto(canvas.toDataURL('image/jpeg', 0.8));
            stopCamera();
        } else { console.error("No se pudo capturar: videoRef o canvasRef es null"); }
    };

    const handleFinalUpdate = async () => {
        setUploading(true);
        try {
            let finalPhotoUrl = user.photo_url;
            if (tempPhoto) {
                const cloudFormData = new FormData();
                cloudFormData.append('file', tempPhoto);
                cloudFormData.append('upload_preset', 'vora_players'); 
                const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', { method: 'POST', body: cloudFormData });
                const cloudData = await cloudRes.json();
                finalPhotoUrl = cloudData.secure_url;
            }
            const response = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, photo_url: finalPhotoUrl, ...formData, stats: user.stats })
            });
            if (response.ok) {
                setUser(prev => ({ ...prev, photo_url: finalPhotoUrl, ...formData }));
                setTempPhoto(null); setView('HOME');
            }
        } catch (err) { alert(`🚨 Error: ${err.message}`); } finally { setUploading(false); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic tracking-widest uppercase">Accediendo al vestuario...</div>;

    if (view === 'SELFIE') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-10 px-6 relative overflow-hidden">
                {showTutorial && <WelcomeTutorial user={user} onFinish={finishTutorial} />}
                <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer active:scale-95 transition-transform drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform scale-[0.80]">
                    <FutCard player={{ ...user, name: formData.name || 'JUGADOR', photo_url: tempPhoto || user?.photo_url, position: formData.position }} />
                </div>
                {!tempPhoto ? (
                    <div className="flex flex-col w-full gap-4 mt-8">
                        <button onClick={() => setView('FORM')} className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl uppercase italic text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <User size={18} className="text-lime-400"/> GESTIONAR DATOS
                        </button>
                        <button onClick={() => setView('HOME')} className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver al inicio</button>
                    </div>
                ) : (
                    <div className="fixed bottom-10 left-0 right-0 z-[100] px-6 flex flex-col gap-3">
                        <button onClick={() => setView('FORM')} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl active:scale-95 transition-all">¡ESTÁ DE LOCOS! <Check/></button>
                        <button onClick={startCamera} className="w-full bg-white/5 backdrop-blur-md text-white/40 font-black py-4 rounded-2xl uppercase italic text-[10px] tracking-widest">REPETIR FOTO</button>
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
                {isCameraOpen && (
                    <div className="fixed inset-0 z-[120] bg-black flex flex-col">
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                        <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline      // 👈 CRÍTICO: Sin esto, iOS bloquea el vídeo o lo abre en pantalla completa
                        muted            // 👈 CRÍTICO: iOS a veces bloquea vídeos con autoplay si no están muteados
                        className="w-full h-full object-cover" 
                        />
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
            </div>
        );
    }

    if (view === 'FORM') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-8 px-6 pb-6">
                <div className="w-full max-w-md space-y-6">
                    <h2 className="text-2xl font-black uppercase italic text-lime-400 text-center">Datos de Ficha</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nombre en Carta</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">DNI / Documento</label>
                            <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Posición</label>
                            <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold outline-none text-white">
                                {['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'ED', 'EI', 'DC'].map(pos => <option key={pos} value={pos} className="bg-[#1a1a1a]">{pos}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nacionalidad</label>
                            <select value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold outline-none text-white">
                                <option value="es">ESPAÑA 🇪🇸</option>
                                <option value="ar">ARGENTINA 🇦🇷</option>
                                <option value="br">BRASIL 🇧🇷</option>
                                <option value="fr">FRANCIA 🇫🇷</option>
                                <option value="gb">INGLATERRA 🏴󠁧󠁢󠁥󠁮󠁧󠁿</option>
                                <option value="de">ALEMANIA 🇩🇪</option>
                                <option value="pt">PORTUGAL 🇵🇹</option>
                                <option value="it">ITALIA 🇮🇹</option>
                                <option value="mx">MÉXICO 🇲🇽</option>
                                <option value="co">COLOMBIA 🇨🇴</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleConfirm} disabled={uploading || !formData.name} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl active:scale-95 transition-all disabled:opacity-30">
                        {uploading ? <Loader2 className="animate-spin m-auto" /> : "CONFIRMAR FICHA"}
                    </button>
                    <button onClick={() => setView('SELFIE')} className="w-full mt-2 py-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver a la foto</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans relative" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 sm:py-12 space-y-6 sm:space-y-8 z-50">
                <button onClick={() => { playClick(); setModalView(null); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${!modalView ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Home size={24} /></button>
                <button onClick={() => { playClick(); setModalView('CALENDAR'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'CALENDAR' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Calendar size={24} /></button>
                <button onClick={() => { playClick(); setModalView('STANDINGS'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'STANDINGS' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Trophy size={24} /></button>
                <button onClick={() => { playClick(); setModalView('ROSTER'); }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${modalView === 'ROSTER' ? 'bg-amber-400 text-black shadow-lg' : 'border-2 border-white/10 text-white/30 hover:text-white'}`}><Users size={24} /></button>
                
                {showInstallBtn ? (
                    <button onClick={() => { playClick(); handleInstallClick(); }} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] animate-pulse"><UploadCloud size={24} /></button>
                ) : (
                    <button onClick={playClick} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white transition-all"><BarChart2 size={24} /></button>
                )}
                
                <button onClick={() => { playClick(); setShowTutorial(true); }} className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto hover:text-white transition-all"><Settings size={24} /></button>
            </aside>

            {showTutorial && <WelcomeTutorial user={user} onFinish={() => { playClick(); setShowTutorial(false); }} />}

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 sm:px-6 overflow-y-auto pt-6 sm:pt-10 pb-6">
                <div 
                    onClick={() => { playClick(); setView('SELFIE'); }} 
                    className="cursor-pointer transform scale-[0.54] sm:scale-75 active:scale-95 transition-all drop-shadow-[0_35px_35px_rgba(0,0,0,0.7)] mt-[-115px] sm:mt-[-90px]"
                >
                    <FutCard player={{ ...user, name: formData.name || user?.name || 'JUGADOR', position: formData.position || user?.position || 'MCO' }} size="large" />
                    <div className="absolute -bottom-10 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse italic">Toca para editar tu ficha</p>
                    </div>
                </div>

                <InfoCenter matches={matches} onMatchClick={() => { playClick(); setModalView('CALENDAR'); }} />
            </main>

            {/* ✅ Modales extraídos y limpios */}
            <AnimatePresence>
                {modalView === 'CALENDAR' && (
                    <CalendarModal matches={matches} onClose={() => { playClick(); setModalView(null); }} />
                )}
                {modalView === 'STANDINGS' && (
                    <StandingsModal standings={standings} onClose={() => { playClick(); setModalView(null); }} />
                )}

                {modalView === 'ROSTER' && (
                <RosterModal roster={roster} onClose={() => { playClick(); setModalView(null); }} />
                )}   
            </AnimatePresence>

        </div>
    );
};

export default PlayerHome;