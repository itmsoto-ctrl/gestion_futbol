// 📄 src/components/portal/ProfileForm.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

const ProfileForm = ({ formData, setFormData, onConfirm, uploading, onBack }) => {
    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center pt-8 px-6 pb-6">
            <div className="w-full max-w-md space-y-6">
                <h2 className="text-2xl font-black uppercase italic text-lime-400 text-center">Datos de Ficha</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nombre en Carta</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white" />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/40 ml-2">DNI / Documento</label>
                        <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold uppercase focus:border-lime-400 outline-none text-white" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/40 ml-2">Posición</label>
                        <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold outline-none text-white">
                            {['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MCO', 'MD', 'MI', 'ED', 'EI', 'DC'].map(pos => <option key={pos} value={pos} className="bg-[#1a1a1a]">{pos}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-white/40 ml-2">Nacionalidad</label>
                        <select value={formData.country_code} onChange={(e) => setFormData({...formData, country_code: e.target.value})} className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 font-bold outline-none text-white">
                            <option value="es">ESPAÑA 🇪🇸</option>
                            <option value="ar">ARGENTINA 🇦🇷</option>
                            <option value="br">BRASIL 🇧🇷</option>
                            <option value="fr">FRANCIA 🇫🇷</option>
                            <option value="gb">INGLATERRA 🏴󠁧󠁢󠁥󠁮󠁧󠁿</option>
                            <option value="de">ALEMANIA 🇩🇪</option>
                            <option value="pt">PORTUGAL 🇵🇹</option>
                            <option value="it">ITALIA 🇮🇹</option>
                            <option value="mx">MÉXICO 🇲🇽</option>
                            <option value="co">COLOMBIA 🇨🇴</option>
                        </select>
                    </div>
                </div>
                <button onClick={onConfirm} disabled={uploading || !formData.name} className="w-full bg-lime-400 text-black font-black py-5 rounded-2xl uppercase italic text-xl shadow-xl active:scale-95 transition-all disabled:opacity-30">
                    {uploading ? <Loader2 className="animate-spin m-auto" /> : "CONFIRMAR FICHA"}
                </button>
                <button onClick={onBack} className="w-full mt-2 py-3 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">Volver a la foto</button>
            </div>
        </div>
    );
};

export default ProfileForm;