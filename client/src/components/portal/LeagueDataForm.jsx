import React from 'react';
import { Hash, CreditCard, Phone, ArrowRight, Loader2, UserCheck, Calendar } from 'lucide-react';

const LeagueDataForm = ({ requiredFields, dorsal, setDorsal, dni, setDni, phone, setPhone, age, setAge, loading, teamName }) => {
    return (
        <div className="animate-in slide-in-from-bottom duration-500 w-full max-w-sm">
            <div className="mb-8">
                <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-white">
                    Área de <br/><span className="text-lime-400">Inscripción</span>
                </h2>
                <div className="flex items-center gap-2 mt-4 border-l-2 border-lime-400 pl-3">
                   <UserCheck size={14} className="text-lime-400" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                       Vinculando perfil a {teamName}
                   </p>
                </div>
            </div>

            <div className="space-y-4">
                
                {/* DORSAL */}
                {requiredFields.dorsal && (
                    <div className="space-y-1">
                        <label htmlFor="dorsal" className="text-[10px] font-black uppercase ml-4 text-white/40 italic">Dorsal en este equipo</label>
                        <div className="relative">
                            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input 
                                id="dorsal"
                                required 
                                type="number" 
                                placeholder="00" 
                                value={dorsal} 
                                onChange={(e) => setDorsal(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg text-white focus:border-lime-400/50 transition-all" 
                            />
                        </div>
                    </div>
                )}

                {/* DNI */}
                {requiredFields.dni && (
                    <div className="space-y-1">
                        <label htmlFor="dni" className="text-[10px] font-black uppercase ml-4 text-white/40 italic">Identificación Global (DNI/NIE)</label>
                        <div className="relative">
                            <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input 
                                id="dni"
                                required 
                                maxLength={9}
                                placeholder="TU IDENTIFICACIÓN" 
                                value={dni} 
                                onChange={(e) => setDni(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg text-white focus:border-lime-400/50 transition-all" 
                            />
                        </div>
                    </div>
                )}

                {/* TELÉFONO */}
                {requiredFields.phone && (
                    <div className="space-y-1">
                        <label htmlFor="phone" className="text-[10px] font-black uppercase ml-4 text-white/40 italic">Teléfono de contacto</label>
                        <div className="relative">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input 
                                id="phone"
                                required 
                                type="tel" 
                                maxLength={15}
                                placeholder="NÚMERO" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg text-white focus:border-lime-400/50 transition-all" 
                            />
                        </div>
                    </div>
                )}

                {/* EDAD */}
                {requiredFields.age && (
                    <div className="space-y-1">
                        <label htmlFor="age" className="text-[10px] font-black uppercase ml-4 text-white/40 italic">Edad</label>
                        <div className="relative">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-lime-400/50" size={18} />
                            <input 
                                id="age"
                                required 
                                type="number" 
                                placeholder="AÑOS" 
                                value={age} 
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-14 rounded-[1.5rem] outline-none font-bold text-lg text-white focus:border-lime-400/50 transition-all" 
                            />
                        </div>
                    </div>
                )}

                <div className="pt-6">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-lime-400 text-black font-black py-6 rounded-[2rem] uppercase italic text-xl flex items-center justify-center gap-3 shadow-2xl shadow-lime-400/10 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>FINALIZAR FICHAJE <ArrowRight size={20}/></>}
                    </button>
                    <p className="text-center text-[8px] uppercase font-bold text-white/20 mt-6 tracking-[0.2em] leading-relaxed px-4">
                        Al confirmar, actualizaremos tu perfil global y te inscribiremos oficialmente en la liga.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LeagueDataForm;