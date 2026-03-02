// src/components/portal/CompleteProfile.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, IdCard, Hash, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const API_URL = "https://gestionfutbol-production.up.railway.app";
    // 🛡️ Extracción segura del state
    const { leagueId, teamId, inviteToken } = location.state || {};
    const [missingFields, setMissingFields] = useState(['photo', 'dni', 'age']); // Default por seguridad

    const [form, setForm] = useState({ dni: '', photo_url: '', phone: '', age: '', dorsal: '' });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        // Si no hay datos, algo fue mal en el flujo
        if (!leagueId || !teamId) {
            console.error("Faltan datos de liga/equipo en el state");
        }
    }, [leagueId, teamId]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'futnex_players');

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            setForm({ ...form, photo_url: data.secure_url });
        } catch (err) {
            alert("Error al subir el selfie.");
        } finally {
            setUploading(false);
        }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        if (!form.photo_url) return alert("Por favor, hazte el selfie obligatorio.");
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 1. Actualizar perfil global
            await axios.post(`${API_URL}/api/auth/update-profile`, form, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // 2. Inscribir en la liga
            await axios.post(`${API_URL}/api/auth/join-team-by-token`, { 
                inviteToken,
                dorsal: form.dorsal 
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            navigate('/admin/dashboard');
        } catch (error) {
            alert("Error al finalizar el registro.");
        } finally {
            setLoading(false);
        }
    };

    if (!leagueId) return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-10 text-center">
            <h2 className="text-red-500 font-black uppercase italic mb-4">Error de Sesión</h2>
            <p className="text-zinc-500 text-sm mb-8">No se han recibido los datos de la liga. Por favor, vuelve al enlace inicial.</p>
            <button onClick={() => navigate(-1)} className="bg-white text-black px-6 py-3 rounded-xl font-bold">Volver</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center font-sans">
            <div className="max-w-sm w-full space-y-8 pt-10">
                <img src="/logo-shine.webp" alt="VORA" className="h-8 mx-auto mb-6" />
                
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-lime-400 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                        <CheckCircle className="text-black" size={32} />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter">
                        VORA <span className="text-lime-400">ID</span>
                    </h1>
                </div>

                <form onSubmit={handleComplete} className="space-y-4">
                    {/* Selfie obligatorio */}
                    <div className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 text-center space-y-4 shadow-xl relative overflow-hidden">
                        <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Foto de Ficha (Selfie)</label>
                        <div className="w-32 h-32 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-lime-400/30 overflow-hidden relative">
                            {uploading ? <Loader2 className="animate-spin text-lime-400" /> : 
                             form.photo_url ? <img src={form.photo_url} className="w-full h-full object-cover" /> : 
                             <Camera size={32} className="text-zinc-600" />}
                            <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
                        </div>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase">{form.photo_url ? "¡Foto lista!" : "Pulsa para abrir cámara"}</p>
                    </div>

                    <div className="space-y-3">
                        <input type="text" placeholder="DNI / NIE" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-5 px-6 font-bold focus:border-lime-400 outline-none" onChange={e => setForm({...form, dni: e.target.value})} required />
                        <input type="number" placeholder="TU EDAD" className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-5 px-6 font-bold focus:border-lime-400 outline-none" onChange={e => setForm({...form, age: e.target.value})} required />
                        <input type="number" placeholder="DORSAL" className="w-full bg-zinc-900 border border-lime-400/30 rounded-2xl py-5 px-6 font-bold focus:border-lime-400 outline-none text-lime-400" onChange={e => setForm({...form, dorsal: e.target.value})} required />
                    </div>

                    <button type="submit" disabled={loading || uploading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 uppercase italic text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50">
                        {loading ? 'Finalizando...' : 'Confirmar Registro'}
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;