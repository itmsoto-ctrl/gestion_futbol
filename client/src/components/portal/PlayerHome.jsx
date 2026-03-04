import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import WelcomeTutorial from './WelcomeTutorial';
import MatchSlider from '../player/MatchSlider';
import useInteractionSounds from '../../hooks/useInteractionSounds';
import { motion } from 'framer-motion'; // Asegúrate de importar motion aquí también

const PlayerHome = () => {
    const { playClick, playSwipe, playOpen } = useInteractionSounds();

    // 📳 Haptic Feedback sutil
    const vibrate = (ms = 20) => {
        if (window.navigator.vibrate) window.navigator.vibrate(ms);
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
    
    const [formData, setFormData] = useState({
        name: '', dni: '', dorsal: '', position: 'DEL', country_code: 'es'
    });

    const [matches, setMatches] = useState([]);
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

    const handleAction = (type, fn) => {
        if (type === 'click') playClick();
        if (type === 'swipe') playSwipe();
        if (type === 'open') playOpen();
        vibrate();
        if (fn) fn();
    };

    const handleFinalUpdate = async () => {
        setUploading(true);
        vibrate([30, 50, 30]); // Vibración de éxito
        playOpen();
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, photo_url: finalPhotoUrl, ...formData, stats: user.stats })
            });
            if (response.ok) {
                setUser(prev => ({ ...prev, photo_url: finalPhotoUrl, ...formData }));
                setTempPhoto(null);
                setView('HOME');
            }
        } catch (err) { alert(`🚨 Error: ${err.message}`); } finally { setUploading(false); }
    };

    // Funciones de cámara simplificadas para el archivo
    const startCamera = () => handleAction('open', async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) { setIsCameraOpen(false); }
    });

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => handleAction('click', () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            setTempPhoto(canvas.toDataURL('image/jpeg', 0.8));
            stopCamera();
        }
    });

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-400 font-black italic tracking-widest uppercase animate-pulse">Cargando Búnker...</div>;

    if (view === 'SELFIE' || view === 'FORM') {
        // ... (Mantenemos tus vistas de Selfie y Form que ya funcionan bien)
        // Solo asegúrate de envolver sus botones en handleAction para el sonido
    }

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* SIDEBAR CON FEEDBACK */}
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 sm:py-12 space-y-6 z-50">
                <button onClick={() => handleAction('click')} className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]"><Home size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all"><Calendar size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all"><Trophy size={24} /></button>
                
                {showInstallBtn && (
                    <button onClick={() => handleAction('click', handleInstallClick)} className="w-12 h-12 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] animate-pulse"><UploadCloud size={24} /></button>
                )}
                
                <button onClick={() => handleAction('open', () => setShowTutorial(true))} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto hover:shadow-[0_0_10px_rgba(255,255,255,0.1)] transition-all"><Settings size={24} /></button>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 overflow-y-auto pt-6 pb-6">
                
                {/* 🃏 CROMO CON BALANCEO VIVO */}
                <motion.div 
                    onClick={() => handleAction('open', () => setView('SELFIE'))} 
                    animate={{ 
                        rotateY: [-4, 4, -4], // Balanceo izquierda-derecha
                        rotateX: [2, -2, 2]    // Balanceo arriba-abajo sutil
                    }}
                    transition={{ 
                        duration: 5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                    }}
                    className="cursor-pointer transform scale-[0.6] sm:scale-75 active:scale-95 transition-all drop-shadow-[0_35px_35px_rgba(0,0,0,0.7)] mt-[-110px] sm:mt-[-90px]"
                >
                    <FutCard player={user} size="large" />
                    <div className="absolute -bottom-10 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">Panel de Control</p>
                    </div>
                </motion.div>

                {/* ⚽ SLIDER CON SONIDO AL DESLIZAR */}
                <div onTouchStart={() => playSwipe()} className="w-full flex justify-center mt-4">
                    <MatchSlider matches={matches} />
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
            </main>
        </div>
    );
};

export default PlayerHome;