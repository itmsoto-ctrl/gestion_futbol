import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, RefreshCw, User, Target, MapPin, Check, Loader2 } from 'lucide-react';
import FutCard from '../FutCard';

const ProfileWizard = ({ user, tempPhoto, onStartCamera, onSave, uploading }) => {
    const [isFlipped, setIsFlipped] = useState(!user?.photo_url); // Gira solo si es nuevo
    const [editData, setEditData] = useState({
        name: user?.name || '',
        position: user?.position || 'DEL',
        country: user?.country_code || 'es'
    });

    return (
        <div className="flex flex-col items-center">
            {/* LEYENDAS SUPERIORES */}
            <div className="text-center mb-6 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400 italic">Pulsa para la foto</p>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Gira para tus datos</p>
            </div>

            {/* CONTENEDOR 3D */}
            <div className="relative perspective-2000">
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative"
                >
                    {/* CARA FRONT: FutCard (Bronce) */}
                    <div className="backface-hidden">
                        <div onClick={onStartCamera} className="cursor-pointer active:scale-95 transition-transform">
                            <FutCard 
                                player={{
                                    ...user,
                                    name: editData.name.toUpperCase() || 'JUGADOR',
                                    photo_url: tempPhoto || user?.photo_url,
                                    position: editData.position,
                                    country_code: editData.country
                                }} 
                                size="large"
                            />
                        </div>
                    </div>

                    {/* CARA BACK: Formulario (Blanco) */}
                    <div 
                        className="absolute inset-0 backface-hidden rounded-[45px] overflow-hidden bg-white shadow-2xl"
                        style={{ rotateY: 180, backgroundImage: "url('/bronce_back.webp')", backgroundSize: 'cover' }}
                    >
                        <div className="flex flex-col p-8 space-y-5 pt-12 h-full text-amber-950 font-sans">
                            <h3 className="font-black italic uppercase tracking-widest text-center border-b border-amber-950/10 pb-2">Ficha Técnica</h3>
                            
                            <div className="space-y-1">
                                <label className="text-[9px] font-black opacity-40 uppercase ml-1">Nombre</label>
                                <input 
                                    type="text" maxLength={12} value={editData.name}
                                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 font-bold uppercase outline-none focus:border-amber-950/30"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black opacity-40 uppercase ml-1">Posición</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {['PO', 'DFC', 'MC', 'DEL'].map(pos => (
                                        <button 
                                            key={pos} onClick={() => setEditData({...editData, position: pos})}
                                            className={`py-2 rounded-lg font-black text-[10px] ${editData.position === pos ? 'bg-amber-950 text-white' : 'bg-amber-950/5 text-amber-950/40'}`}
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-black opacity-40 uppercase ml-1">Nacionalidad</label>
                                <select 
                                    value={editData.country} onChange={(e) => setEditData({...editData, country: e.target.value})}
                                    className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 font-bold uppercase outline-none"
                                >
                                    <option value="es">España 🇪🇸</option>
                                    <option value="ar">Argentina 🇦🇷</option>
                                    <option value="br">Brasil 🇧🇷</option>
                                    <option value="fr">Francia 🇫🇷</option>
                                </select>
                            </div>

                            <button 
                                onClick={() => onSave(editData)} disabled={uploading}
                                className="w-full bg-amber-950 text-white font-black py-4 rounded-xl uppercase italic text-sm mt-auto active:scale-95 transition-all"
                            >
                                {uploading ? <Loader2 className="animate-spin mx-auto" /> : "GUARDAR DATOS"}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* BOTÓN GIRO FLOTANTE */}
                <button 
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 bg-lime-400 text-black p-4 rounded-full shadow-xl z-50 hover:rotate-180 transition-transform duration-500"
                >
                    <RefreshCw size={24} />
                </button>
            </div>
        </div>
    );
};

export default ProfileWizard;