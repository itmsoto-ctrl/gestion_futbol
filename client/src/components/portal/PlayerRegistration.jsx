import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Mail, ArrowRight, Loader2, UserCircle2 } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);

    // Formulario Step 1
    const [email, setEmail] = useState('');

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) setTeamInfo(data.team);
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
            // Aquí guardamos el estado de userExists y pasamos al Step 2
            // Para esta prueba asumiremos que funciona y pasa al Step 2
            setStep(2);
        } catch (err) { alert("Error al conectar con el servidor"); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 flex flex-col items-center">
            
            {/* LOGO GIGANTE CON BRILLO GIRATORIO */}
            <div className="mt-8 mb-12 flex flex-col items-center animate-in fade-in slide-in-from-top duration-1000">
                <div className="relative p-[2px] rounded-full animate-glow-border w-32 h-32 flex items-center justify-center">
                    <img 
                        src="/logo-shine.webp" 
                        alt="VORA" 
                        className="w-[124px] h-[124px] rounded-full object-cover shadow-2xl" 
                    />
                </div>
                
                <h1 className="mt-6 text-white text-5xl font-black uppercase italic text-center leading-none tracking-tighter">
                    VORA <br/><span className="text-lime-400">FOOTBALL</span>
                </h1>
                <p className="mt-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Elite Management</p>
            </div>

            {/* BLOQUE DE BIENVENIDA AL EQUIPO */}
            {teamInfo && (
                <div className="w-full max-w-sm mb-10 animate-in fade-in slide-in-from-top duration-700 delay-200">
                    <div className="bg-zinc-900/50 border border-lime-400/20 p-8 rounded-[3rem] text-center space-y-2 relative overflow-hidden backdrop-blur-xl shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-lime-400/5 blur-3xl rounded-full"></div>
                        <UserCircle2 className="mx-auto text-lime-400 mb-2" size={32} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">Identificación de Jugador</p>
                        <h2 className="text-white text-xl font-bold leading-tight">
                            Vas a unirte a <br/>
                            <span className="italic uppercase font-black text-3xl tracking-tighter text-white">
                                {teamInfo.teamName}
                            </span>
                        </h2>
                    </div>
                </div>
            )}

            {/* PASO 1: INPUT DE EMAIL */}
            {step === 1 && (
                <form onSubmit={handleCheckEmail} className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative group">
                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-lime-400 transition-colors" size={24} />
                        <input 
                            required 
                            type="email" 
                            placeholder="TU EMAIL AQUÍ" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-900 border-2 border-zinc-800 p-6 pl-16 rounded-[2rem] outline-none focus:border-lime-400 font-bold text-lg placeholder:text-zinc-600 transition-all shadow-inner"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-lime-400 text-zinc-950 font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 uppercase italic text-xl shadow-2xl shadow-lime-400/20 active:scale-95 transition-all"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24}/> : <>COMENZAR REGISTRO <ArrowRight size={24}/></>}
                    </button>
                    
                    <p className="text-center text-[9px] text-zinc-700 font-black uppercase tracking-widest">
                        Al continuar aceptas formar parte de la liga vora oficial
                    </p>
                </form>
            )}

            {/* Indicador de progreso abajo (opcional, queda muy bien) */}
            <div className="mt-auto py-8 flex gap-2">
                <div className={`w-12 h-1.5 rounded-full ${step >= 1 ? 'bg-lime-400' : 'bg-zinc-800'}`}></div>
                <div className={`w-12 h-1.5 rounded-full ${step >= 2 ? 'bg-lime-400' : 'bg-zinc-800'}`}></div>
                <div className={`w-12 h-1.5 rounded-full ${step >= 3 ? 'bg-lime-400' : 'bg-zinc-800'}`}></div>
            </div>
        </div>
    );
};

export default PlayerRegistration;