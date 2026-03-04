import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, Trophy, BarChart2, Settings, UploadCloud, Loader2 } from 'lucide-react';
import FutCard from '../FutCard';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import API_BASE_URL from '../../apiConfig';

const PlayerHome = () => {
    const navigate = useNavigate();
    const { showInstallBtn, handleInstallClick } = usePWAInstall();
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const savedEmail = localStorage.getItem('userEmail');
                if (!savedEmail) {
                    setLoading(false);
                    return;
                }

                // 1. Cargamos el perfil (Asegúrate de que el backend ahora incluya el logo del equipo)
                const res = await fetch(`${API_BASE_URL}/api/auth/user-profile?email=${savedEmail}`);
                const data = await res.json();
                
                if (data) {
                    setUser(data);
                    // 2. Cargamos el calendario si tiene equipo asignado
                    if (data.team_id) {
                        const mRes = await fetch(`${API_BASE_URL}/api/leagues/my-calendar/${data.team_id}`);
                        const mData = await mRes.json();
                        setMatches(mData);
                    }
                }
            } catch (err) {
                console.error("Error al cargar datos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-lime-400 mb-4" size={48} />
                <p className="text-white font-black italic tracking-widest uppercase">Cargando Ficha...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-cover bg-center flex overflow-hidden font-sans" 
             style={{ backgroundImage: "url('/bg-home-player.webp')" }}>
            
            {/* SIDEBAR IZQUIERDA (Menú de botones) */}
            <aside className="w-20 bg-red-950/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 space-y-8 z-50">
                <button className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg active:scale-90 transition-transform">
                    <Home size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 active:scale-90 transition-transform">
                    <Calendar size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 active:scale-90 transition-transform">
                    <Trophy size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 active:scale-90 transition-transform">
                    <BarChart2 size={28} />
                </button>
                <button className="w-14 h-14 border-2 border-white/10 rounded-2xl flex items-center justify-center text-white/30 active:scale-90 transition-transform mt-auto">
                    <Settings size={28} />
                </button>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-6 overflow-y-auto pt-10 pb-10">
                
                {/* BOTÓN PWA */}
                {showInstallBtn && (
                    <button onClick={handleInstallClick} className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-3xl text-white animate-pulse active:scale-90 transition-transform z-40">
                        <UploadCloud size={24} />
                    </button>
                )}

                {/* EL CROMO: Escalado y con Clic para editar */}
                <div 
                    onClick={() => navigate('/edit-profile')}
                    className="cursor-pointer transform scale-[0.7] sm:scale-85 active:scale-95 transition-all drop-shadow-[0_45px_45px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-10 duration-700"
                >
                    <FutCard player={user} size="large" />
                    
                    {/* Tooltip flotante */}
                    <div className="absolute -bottom-12 left-0 w-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">
                            Toca para editar tu selfie y datos
                        </p>
                    </div>
                </div>

                {/* DATOS PRÓXIMO ENCUENTRO */}
                <div className="mt-20 text-center space-y-4 animate-in fade-in duration-1000 delay-300">
                    <div className="inline-block px-5 py-1.5 bg-amber-400 text-black text-[10px] font-black uppercase italic rounded-full tracking-[0.2em]">
                        Siguiente Encuentro
                    </div>
                    
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                            {matches[0]?.home_team || 'POR DEFINIR'} <span className="text-amber-400 text-2xl">VS</span> {matches[0]?.away_team || 'POR DEFINIR'}
                        </h2>
                        <div className="flex flex-col gap-1">
                            <p className="text-xl font-bold text-white/90">
                               {matches[0] ? new Date(matches[0].match_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximamente'}
                            </p>
                            <p className="text-xs uppercase tracking-[0.3em] font-black text-amber-400">
                               {matches[0]?.venue_name || 'Estadio Municipal VORA'} — {matches[0] ? new Date(matches[0].match_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '00:00H'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerHome;