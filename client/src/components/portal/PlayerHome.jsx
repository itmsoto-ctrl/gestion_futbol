import React, { useState, useEffect } from 'react';
import { Home, Calendar, Trophy, BarChart2, Settings, Camera, Check, Loader2, UploadCloud } from 'lucide-react';
import FutCard from '../FutCard';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import API_BASE_URL from '../../apiConfig';

const PlayerHome = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tempPhoto, setTempPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [matches, setMatches] = useState([]);
    const { showInstallBtn, handleInstallClick } = usePWAInstall();

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        if (email) {
            fetch(`${API_BASE_URL}/api/auth/user-profile?email=${email}`)
                .then(res => res.json())
                .then(data => {
                    setUser(data);
                    setLoading(false);
                    if (data.team_id) {
                        fetch(`${API_BASE_URL}/api/leagues/my-calendar/${data.team_id}`)
                            .then(res => res.json())
                            .then(setMatches);
                    }
                })
                .catch(() => setLoading(false));
        }
    }, []);

    const handleAccept = async () => {
        if (!tempPhoto) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', tempPhoto);
            formData.append('upload_preset', 'vora_players');

            const cloudRes = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                method: 'POST',
                body: formData
            });
            const cloudData = await cloudRes.json();
            
            if (cloudData.secure_url) {
                const response = await fetch(`${API_BASE_URL}/api/auth/update-photo`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        photo_url: cloudData.secure_url
                    })
                });
                if (response.ok) {
                    setUser({ ...user, photo_url: cloudData.secure_url });
                    setTempPhoto(null);
                }
            }
        } catch (err) {
            alert("Error al guardar la foto");
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-lime-400" size={40} />
        </div>
    );

    // 1. ESTADO DE CAPTURA: Si no hay foto guardada ni captura temporal
    if (!user?.photo_url && !tempPhoto) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="w-full max-w-sm bg-zinc-900 rounded-[3rem] p-10 border border-zinc-800 text-center space-y-8 shadow-2xl">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">Crea tu Ficha</h2>
                        <p className="text-[10px] text-lime-400 font-black uppercase tracking-[0.2em]">Paso Obligatorio</p>
                    </div>
                    <div className="w-56 h-56 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-lime-400/30 overflow-hidden relative group active:scale-95 transition-transform">
                        <Camera size={56} className="text-zinc-600 group-hover:text-lime-400 transition-colors" />
                        <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" 
                               onChange={(e) => {
                                   const reader = new FileReader();
                                   reader.onload = () => setTempPhoto(reader.result);
                                   reader.readAsDataURL(e.target.files[0]);
                               }} />
                    </div>
                    <p className="text-xs text-zinc-500 font-bold uppercase leading-relaxed">Hazte un selfie para generar tu carta personalizada de la liga</p>
                </div>
            </div>
        );
    }

    // 2. ESTADO DE PREVIEW: Cuando te acabas de hacer la foto
    if (tempPhoto && !user?.photo_url) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 space-y-10">
                <div className="animate-in zoom-in duration-500">
                    <FutCard player={{ ...user, photo_url: tempPhoto }} />
                </div>
                <button onClick={handleAccept} disabled={uploading} className="w-full max-w-xs bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(163,230,53,0.3)] active:scale-95 transition-all">
                    {uploading ? <Loader2 className="animate-spin" /> : <><Check size={24} /> ¡ESTÁ DE LOCOS!</>}
                </button>
            </div>
        );
    }

    // 3. EL HOME "PREMIUM": Fondo rojo, botones laterales y texto inferior
    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" 
             style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* SIDEBAR IZQUIERDA (Menú de botones) */}
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-400/20 active:scale-90 transition-transform">
                    <Home size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                    <Calendar size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                    <Trophy size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all">
                    <BarChart2 size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 hover:text-white hover:border-white/30 transition-all mt-auto">
                    <Settings size={28} />
                </button>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-6">
                
                {/* BOTÓN PWA (Discreto y flotante) */}
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-8 right-8 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse active:scale-90 transition-transform">
                        <UploadCloud size={24} />
                    </button>
                )}

                {/* EL CROMO (Con sombra para que flote) */}
                <div className="transform scale-[0.85] sm:scale-100 drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10 duration-700">
                    <FutCard player={user} />
                </div>

                {/* DATOS PRÓXIMO ENCUENTRO (Estilo texto limpio) */}
                <div className="mt-14 text-center space-y-4 animate-in fade-in duration-1000 delay-300">
                    <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em]">
                        Próximo Encuentro
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                            {matches[0]?.home_team || 'LOS GALÁCTICOS'} <span className="text-amber-400 text-2xl">VS</span> {matches[0]?.away_team || 'VORA FC'}
                        </h2>
                        <div className="flex flex-col gap-1">
                            <p className="text-xl font-bold text-white/90">
                               {matches[0] ? new Date(matches[0].match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Sábado 15 de Marzo'}
                            </p>
                            <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-400">
                               {matches[0]?.venue_name || 'Estadio Municipal VORA'} — {matches[0] ? new Date(matches[0].match_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '18:00H'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerHome;