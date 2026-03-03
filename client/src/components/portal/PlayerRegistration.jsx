import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mail, ArrowRight, Loader2, User, Lock, Hash, CreditCard, Camera, CheckCircle, ClipboardList } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); // 1: Email, 2: Registro, 3: Liga, 4: Cromo, 5: Éxito
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [adminConfig, setAdminConfig] = useState({});

    // Formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [dni, setDni] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // FIX NETLIFY: Construcción dinámica de la ruta
    const publicBase = process.env.PUBLIC_URL || "";
    const fileName = "logo-shine.webp";
    const logoUrl = `${publicBase}/${fileName}`;

    useEffect(() => {
        const savedEmail = localStorage.getItem('vora_user_email');
        if (savedEmail) setEmail(savedEmail);

        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setTeamInfo(data.team);
                    setAdminConfig(data.fieldsConfig || {});
                }
            } catch (err) { console.error(err); }
        };
        fetchTeam();
    }, [token]);

    const handleNextStep = (e) => {
        if (e) e.preventDefault();
        setStep(prev => prev + 1);
    };

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        localStorage.setItem('vora_user_email', email);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            setUserExists(data.exists);
            setStep(2);
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (file) {
            setUploading(true);
            const data = new FormData();
            data.append('file', file);
            data.append('upload_preset', 'vora_players');
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/dqoplz61y/image/upload`, {
                    method: 'POST', body: data
                });
                const fileData = await res.json();
                setPhotoUrl(fileData.secure_url);
            } catch (err) { console.error(err); }
            finally { setUploading(false); }
        }
    }, []);

    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: {'image/*': []}, multiple: false });

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/leagues/register-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email, password, fullName, dorsal, dni,
                    teamId: teamInfo?.id,
                    photoUrl,
                    isNewUser: !userExists
                })
            });
            if (res.ok) setStep(5);
            else alert("Error al registrar");
        } catch (err) { alert("Error"); }
        finally { setLoading(false); }
    };

    if (step === 5) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
            <CheckCircle size={80} className="text-lime-400 mb-6" />
            <h1 className="text-3xl text-white font-black uppercase tracking-tighter leading-none italic">Fichaje <br/><span className="text-lime-400">Confirmado</span></h1>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            
            {/* LOGO CON EFECTO HALO-SNAKE RESTAURADO (SUAVE) */}
            <div className="mt-6 mb-8 animate-in fade-in zoom-in duration-1000">
                <div className="relative flex items-center justify-center">
                    <div className="halo-glow"></div> {/* Brillo exterior sutil */}
                    <div className="halo-wrapper"> {/* Contenedor con la serpiente girando */}
                        <img 
                            src={logoUrl} 
                            alt="VORA" 
                            className="logo-img" 
                        />
                    </div>
                </div>
            </div>

            {/* HEADER DINÁMICO */}
            {teamInfo && step < 4 && (
                <div className="w-full max-w-sm mb-10 text-center animate-in fade-in duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-lime-400 mb-1 font-black">
                        {step === 1 && "Bienvenido"}
                        {step === 2 && (userExists ? "Identifícate" : "Crea tu cuenta")}
                        {step === 3 && "Datos de Liga"}
                    </p>
                    <h2 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter truncate">
                        {teamInfo.teamName}
                    </h2>
                </div>
            )}

            <div className="w-full max-w-sm space-y-6">
                {/* PASO 1: EMAIL */}
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-lime-400 transition-colors" size={20} />
                            <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold text-lg" />
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-4 uppercase italic text-xl active:scale-95 transition-all shadow-xl shadow-black/10">
                            {loading ? <Loader2 className="animate-spin" /> : <>CONTINUAR <ArrowRight size={24}/></>}
                        </button>
                    </form>
                )}

                {/* PASO 2: NOMBRE Y PASS */}
                {step === 2 && (
                    <form onSubmit={handleNextStep} className="space-y-4 animate-in slide-in-from-right duration-500">
                        {!userExists && (
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required placeholder="NOMBRE COMPLETO" className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold uppercase"
                                    onChange={(e) => setFullName(e.target.value.toUpperCase())} />
                            </div>
                        )}
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required type="password" placeholder="CONTRASEÑA" className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold"
                                onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        <button className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] mt-4 italic uppercase text-lg active:scale-95 transition-all">
                            SIGUIENTE
                        </button>
                    </form>
                )}

                {/* PASO 3: DORSAL Y REQUERIMIENTOS ADMIN */}
                {step === 3 && (
                    <form onSubmit={handleNextStep} className="space-y-4 animate-in slide-in-from-right duration-500">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 mb-4 text-center">
                            <ClipboardList className="mx-auto text-lime-400 mb-2" size={24} />
                            <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Información para la liga</p>
                        </div>
                        <div className="relative">
                            <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required type="number" placeholder="DORSAL PREFERIDO" className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold"
                                onChange={(e) => setDorsal(e.target.value)} />
                        </div>
                        {adminConfig.dni && (
                            <div className="relative">
                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required placeholder="DNI / NIE / PASAPORTE" className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold uppercase"
                                    onChange={(e) => setDni(e.target.value.toUpperCase())} />
                            </div>
                        )}
                        <button className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2.5rem] mt-4 italic uppercase text-lg active:scale-95 transition-all">
                            CONFIRMAR DATOS
                        </button>
                    </form>
                )}

                {/* PASO 4: CROMO FINAL */}
                {step === 4 && (
                    <div className="flex flex-col items-center animate-in zoom-in-95 w-full">
                         <div className="relative w-64 h-80 bg-gradient-to-b from-lime-400 to-lime-600 rounded-[2.5rem] p-1 shadow-2xl">
                            <div className="bg-zinc-950 w-full h-full rounded-[2.3rem] overflow-hidden relative border border-lime-400/30">
                                {photoUrl ? (
                                    <img src={photoUrl} className="w-full h-full object-cover" alt="Selfie" />
                                ) : (
                                    <div {...getRootProps()} className="flex flex-col items-center cursor-pointer h-full justify-center text-centeropacity-60">
                                        <input {...getInputProps()} capture="user" />
                                        <Camera className="text-white/40 mb-3" size={32} />
                                        <p className="text-[10px] font-black uppercase text-white leading-tight italic">TOCA PARA <br/> TU FOTO DE FICHA</p>
                                    </div>
                                )}
                                <div className="absolute bottom-5 left-0 right-0 px-6 text-left bg-gradient-to-t from-black via-black/90 to-transparent pt-4">
                                    <p className="text-xl font-black uppercase italic leading-none text-white truncate drop-shadow-lg">{fullName.split(' ')[0] || 'JUGADOR'}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-2xl font-black text-lime-400 italic drop-shadow-lg">{dorsal || '00'}</span>
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">{teamInfo?.teamName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleFinalSubmit} disabled={!photoUrl || uploading || loading}
                            className="w-full mt-10 bg-lime-400 text-zinc-950 font-black py-6 rounded-[2.5rem] italic text-xl active:scale-95 shadow-xl shadow-lime-400/10">
                            {loading || uploading ? <Loader2 className="animate-spin" /> : "FINALIZAR REGISTRO"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;