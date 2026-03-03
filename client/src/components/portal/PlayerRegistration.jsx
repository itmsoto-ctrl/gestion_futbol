import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mail, ArrowRight, Loader2, User, Lock, Hash, CreditCard, Camera, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [adminConfig, setAdminConfig] = useState({});

    // Estados del Formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [dni, setDni] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // FIX NETLIFY: Construcción dinámica para evitar errores de módulo
    const publicDir = process.env.PUBLIC_URL || "";
    const logoFile = "logo-shine.webp";
    const fullPath = `${publicDir}/${logoFile}`;

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
            } catch (err) { console.error("Error:", err); }
        };
        fetchTeam();
    }, [token]);

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
        } catch (err) { alert("Error de red"); }
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
                    teamId: teamInfo.id,
                    photoUrl,
                    isNewUser: !userExists
                })
            });
            if (res.ok) setStep(4);
            else alert("Error al registrar");
        } catch (err) { alert("Error"); }
        finally { setLoading(false); }
    };

    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center italic">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-lg" />
            <h1 className="text-3xl text-white font-black uppercase tracking-tighter leading-none">Fichaje <br/><span className="text-lime-400">Confirmado</span></h1>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans">
            
            {/* LOGO CON EFECTOS ELITE (PULSO + SHINE + SOMBRA) */}
            <div className="mt-8 mb-10 animate-in fade-in zoom-in duration-1000">
                <div className="logo-container-elite">
                    {/* El brillo (Shine) que cruza el logo */}
                    <div 
                        className="logo-shine-overlay" 
                        style={{ "--logo-url": `url(${fullPath})` }}
                    />
                    {/* El logo con el pulso y la sombra */}
                    <img 
                        src={fullPath} 
                        alt="VORA" 
                        className="logo-main-elite" 
                    />
                </div>
            </div>

            {/* BIENVENIDA */}
            {teamInfo && step < 3 && (
                <div className="w-full max-w-sm mb-10 text-center animate-in fade-in slide-in-from-top duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-lime-400 mb-2 font-black">Portal del Jugador</p>
                    <h2 className="text-white text-2xl font-black italic uppercase leading-none tracking-tighter">
                        {teamInfo.teamName}
                    </h2>
                </div>
            )}

            <div className="w-full max-w-sm">
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input 
                                required type="email" placeholder="TU EMAIL" value={email} 
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full glass-input p-5 pl-16 rounded-[2rem] outline-none font-bold text-lg"
                            />
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-4 uppercase italic text-xl shadow-2xl shadow-black/20">
                            {loading ? <Loader2 className="animate-spin" /> : <>CONTINUAR <ArrowRight size={24}/></>}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={(e) => {e.preventDefault(); setStep(3);}} className="space-y-4 animate-in slide-in-from-right duration-500">
                        {!userExists && (
                            <input required placeholder="NOMBRE COMPLETO" className="w-full glass-input p-5 rounded-[2rem] outline-none font-bold uppercase placeholder:text-white/20"
                                onChange={(e) => setFullName(e.target.value.toUpperCase())} />
                        )}
                        <input required type="password" placeholder="CONTRASEÑA" className="w-full glass-input p-5 rounded-[2rem] outline-none font-bold placeholder:text-white/20"
                            onChange={(e) => setPassword(e.target.value)} />
                        {!userExists && (
                            <div className="grid grid-cols-2 gap-3">
                                <input required placeholder="DORSAL" type="number" className="glass-input p-5 rounded-[2rem] outline-none font-bold text-center"
                                    onChange={(e) => setDorsal(e.target.value)} />
                                {adminConfig.dni && (
                                    <input required placeholder="DNI" className="glass-input p-5 rounded-[2rem] outline-none font-bold uppercase text-center"
                                        onChange={(e) => setDni(e.target.value.toUpperCase())} />
                                )}
                            </div>
                        )}
                        <button className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] mt-4 italic uppercase text-lg active:scale-95 transition-all">
                            {userExists ? "ENTRAR" : "REGISTRARME"}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <div className="flex flex-col items-center animate-in zoom-in-95">
                         <div className="relative w-64 h-80 bg-gradient-to-b from-lime-400 to-lime-600 rounded-[2.5rem] p-1 shadow-2xl">
                            <div className="bg-zinc-950 w-full h-full rounded-[2.3rem] overflow-hidden relative border border-lime-400/30">
                                {photoUrl ? (
                                    <img src={photoUrl} className="w-full h-full object-cover" alt="Selfie" />
                                ) : (
                                    <div {...getRootProps()} className="flex flex-col items-center cursor-pointer h-full justify-center">
                                        <input {...getInputProps()} capture="user" />
                                        <Camera className="text-white/40 mb-3" size={32} />
                                        <p className="text-[10px] font-black uppercase text-white leading-tight italic text-center">TOCA PARA <br/> HACER EL SELFIE</p>
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
                        <button 
                            onClick={handleFinalSubmit}
                            disabled={!photoUrl || uploading || loading}
                            className="w-full mt-10 bg-lime-400 text-zinc-950 font-black py-6 rounded-[2.5rem] italic text-xl active:scale-95 shadow-xl shadow-lime-400/10"
                        >
                            {loading || uploading ? <Loader2 className="animate-spin" /> : "FINALIZAR FICHA"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;