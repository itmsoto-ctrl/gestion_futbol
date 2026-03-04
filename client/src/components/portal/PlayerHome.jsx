import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, X, Check, Home, Calendar, Trophy, BarChart2, Settings, Loader2, UploadCloud, User } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../../apiConfig';
import FutCard from '../FutCard'; 
import { usePWAInstall } from '../../hooks/usePWAInstall';
import WelcomeTutorial from './WelcomeTutorial';
import MatchSlider from '../player/MatchSlider';
import useInteractionSounds from '../../hooks/useInteractionSounds';

const PlayerHome = () => {
    const { playClick, playSwipe, playOpen } = useInteractionSounds();
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
    const canvasRef = useRef(null); // ✅ Asegurado que se usa
    const streamRef = useRef(null);

    const handleAction = (type, fn) => {
        if (window.navigator.vibrate) window.navigator.vibrate(20);
        if (type === 'click') playClick();
        if (type === 'swipe') playSwipe();
        if (type === 'open') playOpen();
        if (fn) fn();
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) { setLoading(false); return; }
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`);
                const data = await res.json();
                if (data) {
                    const statsBase = data.stats ? (typeof data.stats === 'string' ? JSON.parse(data.stats) : data.stats) : { pac: 60, sho: 60, pas: 60, dri: 60, def: 60, phy: 60 };
                    setUser({ ...data, stats: statsBase });
                    setFormData({ name: data.name || '', dni: data.dni || '', dorsal: data.dorsal || '', position: data.position || 'DEL', country_code: data.country_code || 'es' });
                    if (data.tutorial_seen === 0) { setShowTutorial(true); setView('SELFIE'); }
                    else if (!data.photo_url) { setView('SELFIE'); }
                    else { setView('HOME'); }
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
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 100);
        } catch (err) { alert("Error cámara"); setIsCameraOpen(false); }
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        // ✅ Corregido el acceso al canvas y video
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const data = canvas.toDataURL('image/jpeg', 0.8);
            setTempPhoto(data);
            stopCamera();
        }
    };

    const handleFinalUpdate = async () => {
        setUploading(true);
        handleAction('open');
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
        } catch (err) { alert(err.message); } finally { setUploading(false); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-amber-400 font-black italic tracking-widest uppercase animate-pulse">Entrando...</div>;

    if (view === 'SELFIE') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-10 px-6 relative overflow-hidden">
                <div onClick={() => !tempPhoto && startCamera()} className="cursor-pointer active:scale-95 transition-transform drop-shadow-2xl transform scale-[0.85]">
                    <FutCard player={{ ...user, name: formData.name || 'JUGADOR', photo_url: tempPhoto || user?.photo_url, position: formData.position }} />
                </div>
                {!tempPhoto ? (
                    <div className="flex flex-col w-full gap-4 mt-8">
                        <button onClick={() => setView('FORM')} className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl uppercase italic text-sm flex items-center justify-center gap-3">
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
                <canvas ref={canvasRef} className="hidden" />
            </div>
        );
    }

    if (view === 'FORM') {
        return (
            <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-8 px-6 pb-6">
                <div className="w-full max-w-md space-y-6">
                    <h2 className="text-2xl font-black uppercase italic text-lime-400 text-center tracking-tighter">Ficha Técnica</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nombre en Carta</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 font-bold uppercase focus:border-amber-400 outline-none text-white transition-colors" />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">DNI / Documento</label>
                            <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 font-bold uppercase focus:border-amber-400 outline-none text-white transition-colors" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Posición</label>
                            <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 font-bold outline-none text-white uppercase transition-colors">
                                {['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'ED', 'EI', 'DC'].map(pos => <option key={pos} value={pos} className="bg-zinc-900">{pos}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nacionalidad</label>
                            <select value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 font-bold outline-none text-white transition-colors">
                                <option value="es">ESPAÑA 🇪🇸</option>
                                <option value="ar">ARGENTINA 🇦🇷</option>
                                <option value="br">BRASIL 🇧🇷</option>
                                <option value="pt">PORTUGAL 🇵🇹</option>
                                 
                            </select>
                        </div>
                    </div>
                    <button onClick={handleFinalUpdate} disabled={uploading || !formData.name} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl active:scale-95 transition-all">
                        {uploading ? <Loader2 className="animate-spin m-auto" /> : "CONFIRMAR FICHA"}
                    </button>
                    <button onClick={() => setView('SELFIE')} className="w-full py-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver a la foto</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            <aside className="w-16 sm:w-20 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-8 sm:py-12 space-y-6 z-50">
                <button onClick={() => handleAction('click')} className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg"><Home size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Calendar size={24} /></button>
                <button onClick={() => handleAction('click')} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30"><Trophy size={24} /></button>
                {showInstallBtn && (
                    <button onClick={() => handleAction('click', handleInstallClick)} className="w-12 h-12 border-2 border-lime-400 text-lime-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.3)] animate-pulse"><UploadCloud size={24} /></button>
                )}
                <button onClick={() => handleAction('open', () => setShowTutorial(true))} className="w-12 h-12 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 mt-auto"><Settings size={24} /></button>
            </aside>

            <main className="flex-1 flex flex-col items-center justify-start relative px-4 sm:px-6 overflow-y-auto pt-6 sm:pt-10 pb-6"> 
            {/* CROMO JUNTADO AL SLIDER */} 
            <div 
            onClick={() => { playClick(); setView('SELFIE'); }} 
            className="cursor-pointer transform scale-[0.6] sm:scale-75 active:scale-95 transition-all drop-shadow-[0_35px_35px_rgba(0,0,0,0.7)] mt-[-110px] sm:mt-[-90px]" 
            > 
            <FutCard player={user} size="large" /> 
            <div className="absolute -bottom-10 left-0 w-full text-center"> 
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 animate-pulse">Toca para editar tu ficha</p> 
            </div> 
            </div> 

            {/* SLIDER DE PARTIDOS CON EVENTO DE SONIDO */} 
            <div onClick={onSlideChange} className="w-full flex justify-center"> 
            <MatchSlider matches={matches} /> 
            </div> 
            </main> 
        </div>
    );
};

export default PlayerHome;