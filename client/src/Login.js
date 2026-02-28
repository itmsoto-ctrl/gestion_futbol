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
            onLogin(res.data);
            navigate('/home');
        } catch (error) { 
            alert("Acceso denegado: Revisa credenciales"); 
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-6">
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-fut-gold rounded-full flex items-center justify-center mb-4">
                        <Trophy size={40} className="text-black" />
                    </div>
                    <h1 className="text-white text-3xl font-black uppercase italic text-center">
                        GESTIÓN DE <br/><span className="text-fut-gold">FÚTBOL</span>
                    </h1>
                </div>
                <div className="bg-zinc-900 border-2 border-zinc-800 p-8 rounded-[40px] relative">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input 
                            type="text" placeholder="USUARIO" 
                            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none"
                            onChange={e => setForm({...form, username: e.target.value})}
                        />
                        <input 
                            type="password" placeholder="••••••••" 
                            className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold outline-none"
                            onChange={e => setForm({...form, password: e.target.value})}
                        />
                        <button type="submit" className="w-full bg-fut-gold text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 uppercase">
                            Entrar <ArrowRight size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;