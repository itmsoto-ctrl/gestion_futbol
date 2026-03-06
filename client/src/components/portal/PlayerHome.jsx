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

const PlayerHome = () => {
    const { playClick } = useInteractionSounds();
    const { subscribeUser } = usePushNotifications(); // Hook de Notificaciones
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

                    // 📱 Suscripción Push Automática para Capitanes
                    if (Number(data.is_captain) === 1) {
                        console.log("📢 Capitán detectado, intentando suscribir a Push...");
                        subscribeUser();
                    }

                    if (data.tutorial_seen === 0 || !data.photo_url) setView('SELFIE');
                    else setView('HOME');

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

                        // 🔥 Lógica de Acta Pendiente con Filtro de Proponente
                        if (Number(data.is_captain) === 1) {
                            const pendingRes = await fetch(`${API_BASE_URL}/api/leagues/pending-match/${cleanTeamId}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (pendingRes.ok) {
                                const pendingData = await pendingRes.json();
                                
                                // 🛡️ Si yo fui el que propuso el resultado, no abro el modal
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

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-lime-400 font-black italic uppercase">Accediendo al vestuario...</div>;

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans relative" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 space-y-8 z-50">
                <button onClick={() => setModalView(null)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${!modalView ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Home size={24} /></button>
                <button onClick={() => setModalView('CALENDAR')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'CALENDAR' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Calendar size={24} /></button>
                <button onClick={() => setModalView('STANDINGS')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'STANDINGS' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Trophy size={24} /></button>
                <button onClick={() => setModalView('ROSTER')} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${modalView === 'ROSTER' ? 'bg-yellow-400 text-black shadow-lg' : 'text-white/30'}`}><Users size={24} /></button>
                {showInstallBtn && <button onClick={handleInstallClick} className="w-12 h-12 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center animate-pulse mt-auto mb-4"><UploadCloud size={24} /></button>}
            </aside>

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 overflow-y-auto pt-10">
                <div onClick={() => setView('SELFIE')} className="cursor-pointer transform scale-[0.6] sm:scale-75 active:scale-95 transition-all drop-shadow-2xl mt-[-90px]">
                    <FutCard player={{ ...user }} size="large" />
                </div>
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