import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, IdCard, Hash, Calendar, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

const CompleteProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const API_URL = "https://gestionfutbol-production.up.railway.app";
    const { missingFields, inviteToken } = location.state || { missingFields: [], inviteToken: null };

    // --- ESTADOS ---
    const [form, setForm] = useState({
        dni: '',
        photo_url: '',
        phone: '',
        age: '',
        dorsal: ''
    });
    const [loading, setLoading] = useState(false); // Estado para el envío final
    const [uploading, setUploading] = useState(false); // Estado para la subida a Cloudinary

    // --- LÓGICA DE CLOUDINARY ---
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'futnex_players'); // Asegúrate que sea 'Unsigned' en Cloudinary

        try {
            // Reemplaza 'dqoplz61y' por tu Cloud Name si es distinto
            const res = await fetch('https://api.cloudinary.com/v1_1/dqoplz61y/image/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            setForm({ ...form, photo_url: data.secure_url });
        } catch (err) {
            alert("Error al subir la imagen a la nube.");
        } finally {
            setUploading(false);
        }
    };

    // --- ENVÍO FINAL ---
    const handleComplete = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            // 1. Actualizar perfil global del usuario
            await axios.post(`${API_URL}/api/auth/update-profile`, form, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // 2. Unirse al equipo con el token
            await axios.post(`${API_URL}/api/auth/join-team-by-token`, { 
                inviteToken,
                dorsal: form.dorsal 
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            navigate('/dashboard');
        } catch (error) {
            console.error("Error en registro final:", error);
            alert("Error al completar la inscripción.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center font-sans">
            <div className="max-w-sm w-full space-y-8 pt-10">
                
                {/* BRANDING VORA */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-lime-400 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                        <CheckCircle className="text-black" size={32} />
                    </div>
                    <h1 className="text-4xl font-black uppercase italic leading-none tracking-tighter">
                        VORA <span className="text-lime-400">ID</span>
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                        Validación de ficha oficial
                    </p>
                </div>

                <form onSubmit={handleComplete} className="space-y-4">
                    
                    {/* SECCIÓN FOTO DINÁMICA */}
                        {missingFields.includes('photo') && (
                            <div className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 text-center space-y-4 shadow-xl">
                                <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Foto de Ficha</label>
                                <div className="w-32 h-32 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-2 border-dashed border-zinc-700 overflow-hidden relative group">
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 border-2 border-lime-400 border-t-transparent rounded-full animate-spin mb-2"></div>
                                            <span className="text-[8px] font-black uppercase">Subiendo...</span>
                                        </div>
                                    ) : form.photo_url ? (
                                        <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={32} className="text-zinc-600 group-hover:text-lime-400 transition-colors" />
                                    )}
                                    
                                    {/* Input oculto pero funcional */}
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        capture="user" // 👈 Esto abre la cámara frontal directamente en móviles
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </div>
                                <p className="text-[8px] text-zinc-600 font-bold uppercase">
                                    {form.photo_url ? "¡Foto cargada!" : "Pulsa para hacerte un selfie"}
                                </p>
                            </div>
                        )}

                    <div className="space-y-3">
                        {missingFields.includes('dni') && (
                            <div className="relative group">
                                <IdCard className="absolute left-5 top-5 text-zinc-500 group-focus-within:text-lime-400 transition-colors" size={20} />
                                <input 
                                    type="text" placeholder="DNI / NIE / PASAPORTE" 
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl py-5 pl-14 pr-6 font-bold outline-none focus:border-lime-400 transition-all uppercase"
                                    onChange={e => setForm({...form, dni: e.target.value})}
                                    required
                                />
                            </div>
                        )}

                        {missingFields.includes('age') && (
                            <div className="relative group">
                                <Calendar className="absolute left-5 top-5 text-zinc-500 group-focus-within:text-lime-400 transition-colors" size={20} />
                                <input 
                                    type="number" placeholder="TU EDAD" 
                                    className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl py-5 pl-14 pr-6 font-bold outline-none focus:border-lime-400 transition-all"
                                    onChange={e => setForm({...form, age: e.target.value})}
                                    required
                                />
                            </div>
                        )}

                        {/* El Dorsal siempre se pide por equipo */}
                        <div className="relative group">
                            <Hash className="absolute left-5 top-5 text-lime-400" size={20} />
                            <input 
                                type="number" placeholder="DORSAL" 
                                className="w-full bg-zinc-900 border-2 border-lime-400/30 rounded-2xl py-5 pl-14 pr-6 font-bold outline-none focus:border-lime-400 transition-all text-lime-400"
                                onChange={e => setForm({...form, dorsal: e.target.value})}
                                required
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || uploading}
                        className={`w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 uppercase italic text-lg shadow-xl shadow-lime-400/10 transition-all ${loading || uploading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 hover:bg-white'}`}
                    >
                        {loading ? 'Finalizando...' : 'Confirmar Registro'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>

                <div className="text-center">
                    <span className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.3em]">Power by VORA v2.0</span>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;