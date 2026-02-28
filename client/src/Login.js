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
            const res = await axios.post(`${API_URL}/login`, form);
            const data = res.data;

            // 1. Guardar la sesión en localStorage para que no se borre al recargar
            if (data.token) localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user || data));

            let finalData = { ...data };
            
            // 2. Buscamos si el usuario ya tiene un player_id asignado
            const pId = data.player_id || (data.user && data.user.player_id);

            // 3. Forzamos la recuperación de la carta para evitar la pantalla de selección
            if (data.player) {
                // Si la API ya te mandaba la carta, la guardamos
                localStorage.setItem('player', JSON.stringify(data.player));
            } else if (pId) {
                // Si la API solo te manda el ID, hacemos el GET a la carta
                try {
                    const playerRes = await axios.get(`${API_URL}/players/${pId}`);
                    localStorage.setItem('player', JSON.stringify(playerRes.data));
                    finalData.player = playerRes.data; // Se lo inyectamos al estado global
                } catch (err) {
                    console.warn("No se pudo cargar la carta del jugador", err);
                }
            }

            // 4. Pasamos la data completa (con la carta) a App.jsx y redirigimos
            onLogin(finalData);
            navigate('/dashboard');
            
        } catch (error) { 
            alert("Acceso denegado: Revisa tus credenciales"); 
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6 font-sans">
            {/* Decoración de fondo (Brillo Dorado) */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-fut-gold/10 blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-sm z-10">
                {/* Logo / Icono */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in zoom-in duration-700">
                    <div className="w-20 h-20 bg-fut-gold rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(212,175,55,0.4)] mb-4">
                        <Trophy size={40} className="text-black" />
                    </div>
                    <h1 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none text-center">
                        GESTIÓN DE <br/>
                        <span className="text-fut-gold">FÚTBOL</span>
                    </h1>
                </div>

                {/* Card de Login */}
                <div className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                    {/* Línea decorativa lateral similar al Dashboard */}
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

                {/* Footer del Login */}
                <div className="mt-10 text-center">
                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">
                        v3.9.4 — {new Date().getFullYear()}
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