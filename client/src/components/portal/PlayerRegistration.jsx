import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { User, Mail, Lock, CreditCard, Hash, Camera, CheckCircle, ArrowRight, Loader2, UserCircle2 } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [adminConfig, setAdminConfig] = useState({});

    // Estados de Formulario
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
            } catch (err) { console.error("Error cargando equipo", err); }
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
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    // ... (onDrop para la foto igual que antes)

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 flex flex-col items-center justify-center">
            
            {/* LOGO E INTRODUCCIÓN */}
            <div className="flex flex-col items-center mb-10">
                <img src="/logo-shine.webp" alt="VORA" className="h-16 mb-6 animate-in fade-in zoom-in duration-1000" />
                {!teamInfo ? (
                    <h1 className="text-white text-4xl font-black uppercase italic text-center leading-none tracking-tighter">
                        VORA <br/><span className="text-lime-400">FOOTBALL</span>
                    </h1>
                ) : (
                    /* BLOQUE QUE ME PASASTE CON EFECTO */
                    <div className="animate-in fade-in slide-in-from-top duration-700">
                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] text-center space-y-2 relative overflow-hidden shadow-2xl">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-400/5 blur-3xl rounded-full"></div>
                            <UserCircle2 className="mx-auto text-lime-400" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">Inscripción Oficial</p>
                            <h2 className="text-white text-lg font-bold leading-tight">
                                Identifícate para unirte a <br/>
                                <span className="italic uppercase font-black text-2xl tracking-tighter text-white">
                                    {teamInfo.teamName}
                                </span>
                            </h2>
                        </div>
                    </div>
                )}
            </div>

            {/* PASO 1: EMAIL */}
            {step === 1 && (
                <form onSubmit={handleCheckEmail} className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                        <input 
                            required type="email" placeholder="TU EMAIL AQUÍ" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500"
                        />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 italic shadow-lg shadow-lime-400/10 active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin"/> : <>CONTINUAR <ArrowRight size={20}/></>}
                    </button>
                </form>
            )}

            {/* ... Resto de los STEPS (Login, Registro, Carta) igual que el anterior ... */}
            
        </div>
    );
};

export default PlayerRegistration;