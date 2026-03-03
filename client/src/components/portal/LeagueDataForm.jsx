import React from 'react';
import { ClipboardList, Hash, CreditCard, Phone, ArrowRight, Loader2 } from 'lucide-react';

const LeagueDataForm = ({ fieldsConfig, dorsal, setDorsal, dni, setDni, phone, setPhone, loading, teamName }) => {
    return (
        <div className="animate-in slide-in-from-bottom duration-500 w-full max-w-sm">
            <div className="mb-8">
                <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter">
                    Área de <br/><span className="text-lime-400">Inscripción</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-4 border-l-2 border-lime-400 pl-3">
                    Datos solicitados por el administrador
                </p>
            </div>

            <div className="space-y-4">
                {fieldsConfig.dorsal && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase ml-4 text-white/40">Dorsal Preferido</label>
                        <div className="relative">
                            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input required type="number" placeholder="00" value={dorsal} 
                                onChange={(e) => setDorsal(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg focus:border-lime-400/50 transition-all" />
                        </div>
                    </div>
                )}

                {fieldsConfig.dni && !dni && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase ml-4 text-white/40">DNI / NIE / Pasaporte</label>
                        <div className="relative">
                            <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input required placeholder="TU IDENTIFICACIÓN" value={dni} 
                                onChange={(e) => setDni(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg focus:border-lime-400/50 transition-all" />
                        </div>
                    </div>
                )}

                {fieldsConfig.phone && !phone && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase ml-4 text-white/40">Teléfono de contacto</label>
                        <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input required type="tel" placeholder="NÚMERO" value={phone} 
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg focus:border-lime-400/50 transition-all" />
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <button type="submit" className="w-full bg-lime-400 text-black font-black py-6 rounded-[2rem] uppercase italic text-xl flex items-center justify-center gap-3 shadow-2xl shadow-lime-400/10">
                        {loading ? <Loader2 className="animate-spin" /> : <>CONFIRMAR INSCRIPCIÓN <ArrowRight size={20}/></>}
                    </button>
                    <p className="text-center text-[9px] uppercase font-bold text-white/20 mt-6 tracking-widest">
                        Tus datos serán enviados a {teamName}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeagueDataForm;