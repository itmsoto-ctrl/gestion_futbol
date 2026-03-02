import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, ArrowRight, UserCircle2 } from 'lucide-react';

// 1. IMPORTAMOS LA URL CENTRALIZADA (Asegúrate de que la ruta al archivo es correcta)
import API_BASE_URL from '../../../apiConfig'; 

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [inviteData, setInviteData] = useState(null);
    const inviteToken = searchParams.get('token');
    const destination = searchParams.get('dest'); // Para saber si es 'claim' o 'join'

    // ✅ EFECTO: Carga el contexto de la invitación
    useEffect(() => {
        if (inviteToken) {
            const fetchInviteInfo = async () => {
                try {
                    // Usamos la variable centralizada con backticks
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
        try {
            // 2. LOGIN CENTRALIZADO
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, form);
            const { token, user } = res.data;
            
            // Guardamos el token en localStorage para las siguientes peticiones
            localStorage.setItem('token', token);
            onLogin(res.data);

            if (inviteToken) {
                // 3. SI ES UN CAPITÁN RECLAMANDO EL EQUIPO ('dest=claim')
                if (destination === 'claim') {
                    try {
                        await axios.post(`${API_BASE_URL}/api/leagues/claim-team`, 
                            { teamToken: inviteToken },
                            { headers: { 'Authorization': `Bearer ${token}` } }
                        );
                        console.log("⚽ Equipo reclamado con éxito por el capitán");
                    } catch (claimErr) {
                        console.error("Error al reclamar equipo:", claimErr);
                    }
                }

                // 4. VERIFICACIÓN DE REQUISITOS (Foto, DNI, etc.)
                const checkRes = await axios.get(`${API_BASE_URL}/api/leagues/check-requirements-by-token/${inviteToken}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (checkRes.data.isComplete) {
                    navigate('/dashboard'); 
                } else {
                    // Si le falta la foto o datos, al Complete Profile
                    navigate('/complete-profile', { 
                        state: { 
                            missingFields: checkRes.data.missingFields, 
                            inviteToken,
                            isCaptain: destination === 'claim'
                        } 
                    });
                }
            } else {
                // Login normal sin invitación
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/home');
                }
            }
        } catch (error) { 
            alert("Acceso denegado: Revisa credenciales"); 
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
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">Invitación Activa</p>
                            <h2 className="text-white text-lg font-bold leading-tight">
                                <span className="text-lime-400">{inviteData.adminName}</span> te ha invitado a unirte a <br/>
                                <span className="italic uppercase font-black text-xl tracking-tighter">
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
                        <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(163,230,53,0.2)]">
                            <Trophy size={40} className="text-black" />
                        </div>
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
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] text-zinc-500 font-black uppercase ml-4 tracking-widest">Contraseña</label>
                            <input 
                                type="password" placeholder="••••••••" 
                                className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-lime-400 transition-all placeholder:text-zinc-600"
                                onChange={e => setForm({...form, password: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 uppercase italic text-lg shadow-xl active:scale-95 transition-all hover:bg-lime-400">
                            Acceder <ArrowRight size={20} />
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