import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, ArrowRight, UserCircle2, Loader2 } from 'lucide-react';
import API_BASE_URL from '../../../apiConfig'; 

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [inviteData, setInviteData] = useState(null);
    const inviteToken = searchParams.get('token');
    const destination = searchParams.get('dest');
    
    // 📱 Detector mágico de la App Instalada (PWA)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone ? 1 : 0;

    // 1. Cargamos el contexto de la invitación para saber a qué equipo ir
    useEffect(() => {
        if (inviteToken) {
            const fetchInviteInfo = async () => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/leagues/team-portal/${inviteToken}`);
                    setInviteData(res.data);
                } catch (err) {
                    console.error("Error cargando contexto de invitación:", err);
                }
            };
            fetchInviteInfo();
        }
    }, [inviteToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 2. LOGIN CENTRALIZADO (Ahora enviamos también el chivato de la PWA)
            const payload = {
                ...form,
                is_pwa: isPWA
            };
            
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, payload);
            const { token, user } = res.data;
            
            localStorage.setItem('token', token);
            if(onLogin) onLogin(res.data);

            // 3. ¿Viene de una invitación de equipo?
            if (inviteToken && inviteData) {
                
                // Si el objetivo era reclamar capitanía (dest=claim)
                if (destination === 'claim') {
                    try {
                        await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                            { teamId: inviteData.team.id },
                            { headers: { 'Authorization': `Bearer ${token}` } }
                        );
                        console.log("⚽ Equipo reclamado con éxito");
                    } catch (claimErr) {
                        console.error("Error vinculando capitán:", claimErr);
                    }
                }

                // 4. VERIFICACIÓN DE REQUISITOS (Foto, DNI, etc.)
                const checkRes = await axios.get(`${API_BASE_URL}/api/leagues/check-requirements/${inviteData.team.league_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (checkRes.data.isComplete) {
                    navigate('/admin/dashboard'); 
                } else {
                    // 🚀 SALTO AL PERFIL
                    navigate('/complete-profile', { 
                        state: { 
                            leagueId: inviteData.team.league_id, 
                            teamId: inviteData.team.id,
                            missingFields: checkRes.data.missingFields
                        } 
                    });
                }
            } else {
                // Login normal
                navigate(user.role === 'admin' ? '/admin/dashboard' : '/home');
            }
        } catch (error) { 
            alert("Credenciales incorrectas: Revisa tu usuario y contraseña"); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6 font-sans">
            <div className="w-full max-w-sm space-y-8">
                
                {inviteData && (
                    <div className="animate-in fade-in slide-in-from-top duration-700">
                        <div className="bg-lime-400/10 border border-lime-400/20 p-6 rounded-[2.5rem] text-center space-y-2 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-400/5 blur-3xl rounded-full"></div>
                            <UserCircle2 className="mx-auto text-lime-400" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">Paso Final</p>
                            <h2 className="text-white text-lg font-bold leading-tight">
                                Identifícate para unirte a <br/>
                                <span className="italic uppercase font-black text-xl tracking-tighter text-white">
                                    {inviteData.team.teamName}
                                </span>
                            </h2>
                            {destination === 'claim' && (
                                <div className="mt-2 inline-block bg-white text-black text-[9px] font-black px-3 py-1 rounded-full uppercase italic">
                                    Acceso de Responsable / Capitán
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!inviteData && (
                    <div className="flex flex-col items-center mb-6">
                         <img src="/logo-shine.webp" alt="VORA" className="h-12 mb-6" />
                        <h1 className="text-white text-4xl font-black uppercase italic text-center leading-none tracking-tighter">
                            VORA <br/><span className="text-lime-400">FOOTBALL</span>
                        </h1>
                    </div>
                )}

                <div className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[3rem] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 font-black uppercase ml-4 tracking-widest">Identificación</label>
                            <input 
                                type="text" placeholder="USUARIO / TELÉFONO" 
                                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-lime-400 transition-all uppercase placeholder:text-zinc-600"
                                onChange={e => setForm({...form, username: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 font-black uppercase ml-4 tracking-widest">Contraseña</label>
                            <input 
                                type="password" placeholder="••••••••" 
                                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-zinc-600"
                                onChange={e => setForm({...form, password: e.target.value})}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-white text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 uppercase italic text-lg shadow-xl active:scale-95 transition-all hover:bg-lime-400"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <>Acceder <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </div>

                <p className="text-center text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">
                    VORA ID SYSTEM
                </p>
            </div>
        </div>
    );
};

export default Login;