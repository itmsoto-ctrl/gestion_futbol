import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import WelcomeTutorial from './WelcomeTutorial';
import InfoCenter from '../player/InfoCenter'; 
import StandingsModal from '../player/StandingsModal';
import CalendarModal from '../player/CalendarModal'; 
import useInteractionSounds from '../../hooks/useInteractionSounds';
import RosterModal from '../player/RosterModal';

// 👇 Importamos los nuevos módulos visuales
import ProfileForm from './ProfileForm';
import PlayerSidebar from './PlayerSidebar';
import TacticalScouting from '../scouting/TacticalScouting';

const PlayerHome = () => {
    const { playClick } = useInteractionSounds();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    const [modalView, setModalView] = useState(null);
    
    // Estados Globales
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('HOME'); 
    const [showTutorial, setShowTutorial] = useState(false);
    
    // 🔥 ESTADOS PARA SCOUTING
    const [rivals, setRivals] = useState([]);
    const [isPlayerExpanded, setIsPlayerExpanded] = useState(false); // 👈 Controla si ocultamos la "X"

    // Estados de Cámara
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null); 
    const streamRef = useRef(null);

    // Datos Deportivos
    const [standings, setStandings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [roster, setRoster] = useState([]);
    const [formData, setFormData] = useState({
        name: '', dni: '', dorsal: '', position: 'DEL', country_code: 'es'
    });

    const handleConfirm = () => {
        playClick();
        if (window.navigator.vibrate) window.navigator.vibrate([30, 50, 30]);
        handleFinalUpdate();
    };

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
                const token = localStorage.getItem('token'); 

                if (!savedEmail || !token) { setLoading(false); return; }
                
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
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

                    if (data.tutorial_seen === 0) {
                        setShowTutorial(true); 
                        setView('SELFIE'); 
                    } else if (!data.photo_url) {
                        setView('SELFIE'); 
                    } else {
                        setView('HOME'); 
                    }

                    if (data.team_id) {
                        const mRes = await fetch(`${API_BASE_URL}/api/leagues/my-calendar/${data.team_id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const mData = await mRes.json();
                        setMatches(mData);
                        setStandings(calculateStandings(mData));

                        try {
                            const rRes = await fetch(`${API_BASE_URL}/api/leagues/teams/${data.team_id}/players`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if(rRes.ok) setRoster(await rRes.json());
                        } catch(err) { console.error("❌ Error cargando plantilla:", err); }

                        try {
                            const sRes = await fetch(`${API_BASE_URL}/api/leagues/scouting-next-rival/${data.team_id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (sRes.ok) {
                                const sData = await sRes.json();
                                setRivals(sData.rivals || []);
                            }
                        } catch(err) { console.error("❌ Error cargando rivales:", err); }

                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchUserData();
        return () => stopCamera();
    }, []);

    const finishTutorial = async () => {
        setShowTutorial(false);
        try {
            await fetch(`${API_BASE_URL}/api/auth/complete-tutorial`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email })
            });
        } catch (err) { console.error(err); }
    };

    const startCamera = async () => {
        setTempPhoto(null); setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 }, height: { ideal: 1350 } } });
            streamRef.current = stream;
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
        } catch (err) { alert("Error cámara"); setIsCameraOpen(false); }
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

    if (view === 'FORM') {
        return <ProfileForm formData={formData} setFormData={setFormData} onConfirm={handleConfirm} uploading={uploading} onBack={() => setView('SELFIE')} />;
    }

    if (view === 'SELFIE') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-10 px-6 relative overflow-hidden">
                {showTutorial && <WelcomeTutorial user={user} onFinish={finishTutorial} />}
                <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer active:scale-95 transition-transform drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform scale-[0.80]">
                    <FutCard player={{ ...user, name: formData.name || 'JUGADOR', photo_url: tempPhoto || user?.photo_url, position: formData.position }} 
                    showAnim={true} 
                    showShine={true}/>
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
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
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

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans relative" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            <PlayerSidebar 
                modalView={modalView} 
                setModalView={setModalView} 
                showInstallBtn={showInstallBtn} 
                handleInstallClick={handleInstallClick} 
                playClick={playClick} 
                setShowTutorial={setShowTutorial} 
            />

            {showTutorial && <WelcomeTutorial user={user} onFinish={() => { playClick(); setShowTutorial(false); }} />}

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 sm:px-6 overflow-y-auto pt-6 sm:pt-10 pb-6">
                <div 
                    onClick={() => { playClick(); setView('SELFIE'); }} 
                    className="cursor-pointer transform scale-[0.54] sm:scale-75 active:scale-95 transition-all drop-shadow-[0_35px_35px_rgba(0,0,0,0.7)] mt-[-115px] sm:mt-[-90px]"
                >
                    <FutCard 
                        player={{ ...user, name: formData.name || user?.name || 'JUGADOR', position: formData.position || user?.position || 'MCO' }} 
                        showAnim={true} 
                        showShine={true} 
                    />
                    <div className="absolute -bottom-10 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse italic">Toca para editar tu ficha</p>
                    </div>
                </div>

                <InfoCenter matches={matches} onMatchClick={() => { playClick(); setModalView('SCOUTING'); }} />
            </main>

            <AnimatePresence>
                {modalView === 'CALENDAR' && <CalendarModal matches={matches} onClose={() => { playClick(); setModalView(null); }} />}
                {modalView === 'STANDINGS' && <StandingsModal standings={standings} onClose={() => { playClick(); setModalView(null); }} />}
                {modalView === 'ROSTER' && <RosterModal roster={roster} onClose={() => { playClick(); setModalView(null); }} />}
                
                {modalView === 'SCOUTING' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
                    >
                        {/* ✅ Solo mostramos la X si no hay jugador ampliado */}
                        {!isPlayerExpanded && (
                            <button 
                                onClick={() => { playClick(); setModalView(null); setIsPlayerExpanded(false); }} 
                                className="absolute top-12 right-6 text-white/70 hover:text-white z-[210] bg-white/10 p-2 rounded-full backdrop-blur-md"
                            >
                                <X size={24} />
                            </button>
                        )}

                        <TacticalScouting 
                            rivals={rivals} 
                            onToggleExpand={(isExpanded) => setIsPlayerExpanded(isExpanded)} 
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlayerHome;