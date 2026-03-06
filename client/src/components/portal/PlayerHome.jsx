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
import CalendarModal from '../player/CalendarModal'; 
import useInteractionSounds from '../../hooks/useInteractionSounds';
import RosterModal from '../player/RosterModal';
import MatchRecordModal from '../player/MatchRecordModal';
import { usePushNotifications } from '../../hooks/usePushNotifications'; 
// 👇 AÑADIDO: Importamos el Wizard para que se pueda dibujar cuando pinches la carta
import ProfileWizard from './ProfileWizard'; 

const PlayerHome = () => {
    const { playClick } = useInteractionSounds();
    const { subscribeUser } = usePushNotifications(); 
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('HOME'); 
    const [showTutorial, setShowTutorial] = useState(false);
    
    // Estados para la cámara y el modo selfie
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const [modalView, setModalView] = useState(null); 
    const [standings, setStandings] = useState([]);
    const [matches, setMatches] = useState([]);
    const [roster, setRoster] = useState([]);
    const [pendingMatch, setPendingMatch] = useState(null); 

    const videoRef = useRef(null);
    const canvasRef = useRef(null); 
    const streamRef = useRef(null);

    const calculateStandings = (matchesData) => {
        if (!Array.isArray(matchesData)) return [];
        const table = {};
        matchesData.forEach(m => {
            [m.home_team, m.away_team].forEach(t => {
                if (!table[t]) table[t] = { name: t, pj: 0, pts: 0, gf: 0, gc: 0 };
            });
            if (m.score_home !== null && m.score_home !== undefined) {
                const h = table[m.home_team];
                const a = table[m.away_team];
                h.pj++; a.pj++;
                h.gf += m.score_home; h.gc += m.score_away;
                a.gf += m.score_away; a.gc += m.score_home;
                if (m.score_home > m.score_away) h.pts += 3;
                else if (m.score_home < m.score_away) a.pts += 3;
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

                    if (Number(data.is_captain) === 1) {
                        console.log("📢 Capitán detectado, intentando suscribir a Push...");
                        subscribeUser();
                    }

                    // 🛡️ Lógica de Vistas Original: Si es nuevo va al selfie o al tutorial
                    if (data.tutorial_seen === 0) {
                        setShowTutorial(true);
                    } else if (!data.photo_url) {
                        setView('SELFIE');
                    } else {
                        setView('HOME');
                    }

                    if (data.team_id) {
                        const cleanTeamId = String(data.team_id).split(':')[0];
                        
                        // Carga de Calendario
                        const mRes = await fetch(`${API_BASE_URL}/api/leagues/my-calendar/${cleanTeamId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (mRes.ok) {
                            const mData = await mRes.json();
                            setMatches(mData);
                            setStandings(calculateStandings(mData));
                        }

                        // 🔥 Lógica de Acta Pendiente
                        if (Number(data.is_captain) === 1) {
                            const pendingRes = await fetch(`${API_BASE_URL}/api/leagues/pending-match/${cleanTeamId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (pendingRes.ok) {
                                const pendingData = await pendingRes.json();
                                const myId = data.id || data.userId;
                                const alreadyProposedByMe = pendingData?.score_proposer_id && 
                                                            Number(pendingData.score_proposer_id) === Number(myId);

                                if (pendingData?.id && !alreadyProposedByMe) {
                                    setTimeout(() => setPendingMatch(pendingData), 800);
                                }
                            }
                        }

                        // Carga de Plantilla
                        const rRes = await fetch(`${API_BASE_URL}/api/leagues/teams/${cleanTeamId}/players`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if(rRes.ok) setRoster(await rRes.json());
                    }
                }
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchUserData();
    }, []);

    // --- 📷 FUNCIONES DE LA CÁMARA PARA EL WIZARD ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            alert("No se pudo acceder a la cámara.");
            setIsCameraOpen(false);
        }
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
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setTempPhoto(dataUrl);
            stopCamera();
        }
    };

    const handleSaveProfile = async (editData) => {
        setUploading(true);
        let finalPhotoUrl = user.photo_url;

        // Si se tomó una nueva foto, súbela a Cloudinary
        if (tempPhoto && tempPhoto !== user.photo_url) {
            try {
                const formData = new FormData();
                formData.append('file', tempPhoto);
                formData.append('upload_preset', 'futnex_players');
                const cloudinaryRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                    method: 'POST', body: formData
                });
                const data = await cloudinaryRes.json();
                finalPhotoUrl = data.secure_url;
            } catch (error) {
                alert("Error subiendo foto. Intenta de nuevo.");
                setUploading(false);
                return;
            }
        }

        // Guarda en tu base de datos
        try {
            const payload = {
                email: user.email,
                photo_url: finalPhotoUrl,
                name: editData.name,
                position: editData.position,
                country_code: editData.country
            };

            const res = await fetch(`${API_BASE_URL}/api/auth/update-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setUser({ ...user, ...editData, photo_url: finalPhotoUrl });
                setTempPhoto(null);
                setView('HOME');
            }
        } catch (error) {
            alert("Error actualizando perfil");
        } finally {
            setUploading(false);
        }
    };

    const completeTutorial = async () => {
        setShowTutorial(false);
        try {
            await fetch(`${API_BASE_URL}/api/auth/complete-tutorial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });
        } catch (e) { console.error(e); }
        if (!user?.photo_url) setView('SELFIE');
    };

    // --- 🚪 RENDERIZADO CONDICIONAL DE VISTAS ---

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic uppercase">Accediendo al vestuario...</div>;

    // 1️⃣ VISTA: Tutorial de Bienvenida
    if (showTutorial) return <WelcomeTutorial onComplete={completeTutorial} />;

    // 2️⃣ VISTA: Cámara Activa
    if (isCameraOpen) return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-end">
            <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute top-8 right-8 bg-black/50 p-3 rounded-full text-white cursor-pointer" onClick={stopCamera}>
                <X size={24} />
            </div>
            <div className="relative z-10 p-10 flex justify-center pb-20 bg-gradient-to-t from-black/80 to-transparent">
                <button onClick={capturePhoto} className="w-20 h-20 bg-white border-4 border-lime-400 rounded-full shadow-[0_0_30px_rgba(163,230,53,0.5)] active:scale-90 transition-transform"></button>
            </div>
        </div>
    );

    // 3️⃣ VISTA: Edición de Perfil (ProfileWizard)
    if (view === 'SELFIE') return (
        <div className="min-h-screen bg-[#665C5A] pt-10 px-4 font-sans text-white overflow-hidden flex flex-col items-center">
            <header className="w-full max-w-sm flex justify-between items-center mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Tu <br/><span className="text-lime-400">Ficha</span></h1>
                {user?.photo_url && (
                    <button onClick={() => setView('HOME')} className="text-white/50 uppercase font-black text-[10px] tracking-widest flex items-center gap-1 active:scale-95">
                        <X size={14} /> Cancelar
                    </button>
                )}
            </header>
            
            <ProfileWizard 
                user={user} 
                tempPhoto={tempPhoto} 
                onStartCamera={startCamera} 
                onSave={handleSaveProfile} 
                uploading={uploading} 
            />
        </div>
    );

    // 4️⃣ VISTA: Dashboard Principal (HOME)
    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans relative" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* BARRA LATERAL (Solo modo HOME) */}
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 space-y-8 z-50">
                <button onClick={() => setModalView(null)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!modalView ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Home size={24} /></button>
                <button onClick={() => setModalView('CALENDAR')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'CALENDAR' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Calendar size={24} /></button>
                <button onClick={() => setModalView('STANDINGS')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'STANDINGS' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Trophy size={24} /></button>
                <button onClick={() => setModalView('ROSTER')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'ROSTER' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Users size={24} /></button>
                {showInstallBtn && <button onClick={handleInstallClick} className="w-12 h-12 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center animate-pulse mt-auto mb-4"><UploadCloud size={24} /></button>}
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col items-center justify-start relative px-4 overflow-y-auto pt-10">
                {/* 🎯 EL CLIC EN LA CARTA AHORA FUNCIONA */}
                <div onClick={() => { playClick(); setView('SELFIE'); }} className="cursor-pointer transform scale-[0.6] sm:scale-75 active:scale-95 transition-all drop-shadow-2xl mt-[-90px]">
                    <FutCard player={{ ...user }} size="large" />
                </div>
                
                <p className="text-[9px] uppercase font-black text-white/50 tracking-widest -mt-4 mb-4">
                    Toca la tarjeta para editarla
                </p>

                <InfoCenter matches={matches} onMatchClick={() => setModalView('CALENDAR')} />
            </main>

            <AnimatePresence>
                {pendingMatch && (
                    <MatchRecordModal 
                        match={pendingMatch} 
                        user={user} 
                        onComplete={() => { setPendingMatch(null); window.location.reload(); }} 
                    />
                )}
                {modalView === 'CALENDAR' && <CalendarModal matches={matches} onClose={() => setModalView(null)} />}
                {modalView === 'STANDINGS' && <StandingsModal standings={standings} onClose={() => setModalView(null)} />}
                {modalView === 'ROSTER' && <RosterModal roster={roster} onClose={() => setModalView(null)} />}   
            </AnimatePresence>
        </div>
    );
};

export default PlayerHome;