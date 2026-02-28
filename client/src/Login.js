import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Trophy, Lock, User, ArrowRight } from 'lucide-react';

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const navigate = useNavigate();
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Hacemos el login normal
            const res = await axios.post(`${API_URL}/login`, form);
            const data = res.data;
            let finalData = { ...data };

            // 2. Buscamos la carta del jugador automáticamente
            try {
                const playersRes = await axios.get(`${API_URL}/players`);
                const userObj = data.user || data;
                
                // Buscamos la carta que coincida con tu usuario
                const miCarta = playersRes.data.find(p => 
                    String(p.user_id) === String(userObj.id) || 
                    String(p.id) === String(userObj.player_id)
                );

                if (miCarta) {
                    finalData.player = miCarta; // Le inyectamos la carta a los datos
                }
            } catch (err) {
                console.warn("Fallo al recuperar la carta en el login:", err);
            }

            // 3. Pasamos todo a App.jsx (que ahora sí guardará my_player)
            onLogin(finalData);
            
            // 4. Redirigimos a home (App.jsx ya decidirá si mostrar Dashboard u Onboarding)
            navigate('/home');
            
        } catch (error) { 
            alert("Acceso denegado: Revisa tus credenciales"); 
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6 font-sans">
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-fut-gold/10 blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-sm z-10">
                <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-fut-gold rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-4">
                        <Trophy size={40} className="text-black" />
                    </div>
                    <h1 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none text-center">
                        GESTIÓN DE <br/>
                        <span className="text-fut-gold">FÚTBOL</span>
                    </h1>
                </div>

                <div className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                    <div className="absolute left-0 top-10 bottom-10 w-1 bg-fut-gold rounded-r-full shadow-[2px_0_15px_#d4af37]"></div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-2 mb-2 block">Usuario</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="USUARIO" 
                                    className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-fut-gold rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                                    onChange={e => setForm({...form, username: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest ml-2 mb-2 block">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="w-full bg-zinc-800 border-2 border-zinc-700 focus:border-fut-gold rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                                    onChange={e => setForm({...form, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="w-full bg-fut-gold text-black font-black py-5 rounded-2xl mt-4 flex items-center justify-center gap-2 uppercase tracking-tighter shadow-[0_10px_20px_rgba(212,175,55,0.2)] active:scale-95 transition-all"
                        >
                            Entrar al Estadio <ArrowRight size={20} />
                        </button>
                    </form>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
                        v3.9.5 — {new Date().getFullYear()}
                    </p>
                    <p className="text-zinc-500 text-[9px] font-bold mt-2">
                        DESIGNED BY <span className="text-zinc-400">DANIEL MARTINEZ</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;