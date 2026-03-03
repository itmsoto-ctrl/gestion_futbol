import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mail, ArrowRight, Loader2, UserCircle2, User, Lock, Hash, CreditCard, Camera, CheckCircle, Sparkles } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [adminConfig, setAdminConfig] = useState({});

    // Estados del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [dni, setDni] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setTeamInfo(data.team);
                    setAdminConfig(data.fieldsConfig || {});
                }
            } catch (err) { console.error("Error al cargar equipo", err); }
        };
        fetchTeam();
    }, [token]);

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            setUserExists(data.exists);
            setStep(2);
        } catch (err) { alert("Error de red"); }
        finally { setLoading(false); }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setUploading(true);
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', 'test_unsigned');
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/dqoplz61y/image/upload`, {
                    method: 'POST',
                    body: data
                });
                const fileData = await res.json();
                setPhotoUrl(fileData.secure_url);
            } catch (err) { console.error(err); }
            finally { setUploading(false); }
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: {'image/*': []}, multiple: false });

    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center italic font-black uppercase transition-all duration-500">
            <CheckCircle size={80} className="text-lime-400 mb-4 animate-bounce" />
            <h1 className="text-3xl text-white italic tracking-tighter">Fichaje Completado</h1>
        </div>
    );

    return (
        // 🧪 FONDO EXPERIMENTAL GRIS: bg-[#665C5A]
        <div className="min-h-screen bg-[#665C5A] text-white font-sans p-6 flex flex-col items-center transition-all duration-500">
            
            {/* LOGO CON EFECTO HALO-SNAKE (USANDO TU CSS EXACTO) */}
            <div className="mt-6 mb-10 flex flex-col items-center animate-in fade-in slide-in-from-top duration-1000">
                <div className="relative flex items-center justify-center">
                    <div className="halo-glow"></div> {/* El brillo exterior sutil */}
                    <div className="halo-wrapper"> {/* El contenedor con la serpiente girando */}
                        <img 
                            src="/logo-shine.webp" 
                            alt="VORA" 
                            className="logo-img rounded-full" // Clase que define el tamaño (90px) y posición
                        />
                    </div>
                </div>
            </div>

            {/* BLOQUE DE BIENVENIDA AL EQUIPO */}
            {teamInfo && step < 3 && (
                <div className="w-full max-w-sm mb-8 animate-in fade-in slide-in-from-top duration-700">
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
                        <UserCircle2 className="mx-auto text-lime-400 mb-1" size={28} />
                        <h2 className="text-white text-lg font-bold leading-tight">
                            Únete a <span className="italic uppercase font-black text-xl text-white block mt-1 tracking-tighter">{teamInfo.teamName}</span>
                        </h2>
                    </div>
                </div>
            )}

            {/* PASO 1: EMAIL */}
            {step === 1 && (
                <form onSubmit={handleCheckEmail} className="w-full max-w-sm space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-lime-400 transition-colors" size={20} />
                        <input 
                            required type="email" placeholder="TU EMAIL AQUÍ" value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            // Placeholder gris más claro para que sea legible sobre el nuevo fondo
                            className="w-full bg-zinc-950 border-2 border-zinc-800 p-5 pl-16 rounded-[2rem] outline-none focus:border-lime-400 font-bold text-lg placeholder:text-zinc-600"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-4 uppercase italic text-xl shadow-xl active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <>CONTINUAR <ArrowRight size={24}/></>}
                    </button>
                </form>
            )}

            {/* PASO 2: DATOS Y PASSWORD */}
            {step === 2 && (
                <form onSubmit={(e) => {e.preventDefault(); setStep(3);}} className="w-full max-w-sm space-y-4 animate-in slide-in-from-right duration-500">
                    {!userExists && (
                        <input required placeholder="NOMBRE COMPLETO" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-lime-400 font-bold uppercase placeholder:text-zinc-700"
                            onChange={(e) => setFullName(e.target.value.toUpperCase())} />
                    )}
                    <input required type="password" placeholder="CONTRASEÑA" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-lime-400 font-bold placeholder:text-zinc-700"
                        onChange={(e) => setPassword(e.target.value)} />
                    {!userExists && (
                        <div className="grid grid-cols-2 gap-3">
                            <input required placeholder="DORSAL" type="number" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-lime-400 font-bold placeholder:text-zinc-700"
                                onChange={(e) => setDorsal(e.target.value)} />
                            {adminConfig.dni && (
                                <input required placeholder="DNI" className="w-full bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] outline-none focus:border-lime-400 font-bold uppercase placeholder:text-zinc-700"
                                    onChange={(e) => setDni(e.target.value.toUpperCase())} />
                            )}
                        </div>
                    )}
                    <button className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] mt-2 italic uppercase text-lg shadow-xl active:scale-95 transition-all">
                        {userExists ? "ENTRAR Y UNIRME" : "CREAR MI CUENTA"}
                    </button>
                </form>
            )}

            {/* PASO 3: LA CARTA FUT TEAM (LA PARTE MÁS BONITA) */}
            {step === 3 && (
                <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-500 mt-2">
                    {/* He reducido el tamaño del cromo ligeramente para asegurar que quepa todo sin scroll */}
                    <div className="relative w-56 h-72 bg-gradient-to-b from-lime-400 to-lime-600 rounded-[2.5rem] p-1 shadow-[0_0_50px_rgba(163,230,53,0.3)]">
                        <div className="bg-zinc-950 w-full h-full rounded-[2.3rem] overflow-hidden relative border border-lime-400/30">
                            {photoUrl ? (
                                <img src={photoUrl} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="Selfie" />
                            ) : (
                                <div {...getRootProps()} className="flex flex-col items-center cursor-pointer p-4 h-full justify-center text-center opacity-60">
                                    <input {...getInputProps()} capture="user" />
                                    <Camera className="text-white mb-2" size={32} />
                                    <p className="text-[9px] font-black uppercase text-white leading-tight italic">TOCA PARA <br/> HACER EL SELFIE</p>
                                </div>
                            )}
                            
                            {/* Overlay de datos en el cromo */}
                            <div className="absolute bottom-5 left-0 right-0 px-6 text-left bg-gradient-to-t from-black via-black/80 to-transparent pt-4">
                                <p className="text-xl font-black uppercase italic leading-none text-white">{fullName.split(' ')[0] || 'NOMBRE'}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-2xl font-black text-lime-400 italic leading-none">{dorsal || '00'}</span>
                                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{teamInfo?.teamName}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={!photoUrl || uploading || loading}
                        className="w-full mt-8 bg-lime-400 text-zinc-950 font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-3 italic text-lg shadow-xl disabled:opacity-20 active:scale-95 transition-all"
                    >
                        {loading || uploading ? <Loader2 className="animate-spin"/> : <>FINALIZAR FICHA <CheckCircle size={24}/></>}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PlayerRegistration;