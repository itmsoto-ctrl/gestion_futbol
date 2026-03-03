import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, User, Lock, Loader2, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); // 1: Email, 2: Datos, 3: Éxito
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    
    // Datos de Formulario
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const logoUrl = "/logo-shine.webp";

    // 1. CARGAR INFO DEL EQUIPO (Contexto del portal)
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) setTeamInfo(data.team);
            } catch (err) { console.error("Error cargando equipo:", err); }
        };
        fetchTeam();
    }, [token]);

    // 2. PASO 1: VERIFICAR EMAIL (Ruta de Auth)
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

            if (data.exists) {
                alert("Este email ya está registrado. (Pronto activaremos el login)");
            } else {
                setStep(2); // Usuario nuevo: ir a crear cuenta
            }
        } catch (err) {
            alert("Error al conectar con el servidor de autenticación");
        } finally {
            setLoading(false);
        }
    };

    // 3. PASO 2: CREAR USUARIO EN 'USERS' (Ruta de Auth)
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register-basic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password })
            });

            if (res.ok) {
                setStep(3); // Éxito en la creación
            } else {
                const error = await res.json();
                alert(error.error || "Error al crear la cuenta");
            }
        } catch (err) {
            alert("Fallo en la comunicación con el servidor");
        } finally {
            setLoading(false);
        }
    };

    // VISTA DE ÉXITO
    if (step === 3) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">¡USUARIO CREADO!</h1>
            <p className="mt-4 opacity-70">Tu perfil global en VORA para {email} está listo.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            
            {/* LOGO CON SHINE CRISTAL */}
            <div className="mt-8 mb-6 relative logo-container-shine">
                <div className="logo-shine-overlay" style={{ "--logo-url": `url(${logoUrl})` }} />
                <img src={logoUrl} alt="VORA" className="logo-main-shine" />
            </div>

            {/* CONTEXTO DE INVITACIÓN */}
            {teamInfo && step < 3 && (
                <div className="w-full max-w-sm mb-10 text-center animate-in fade-in duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-lime-400 mb-2">Invitación recibida para:</p>
                    <h2 className="text-white text-3xl font-black italic uppercase leading-none tracking-tighter truncate">
                        {teamInfo.teamName}
                    </h2>
                </div>
            )}

            <div className="w-full max-w-sm">
                {/* FORMULARIO PASO 1: EMAIL */}
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-lime-400 transition-colors" size={20} />
                            <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold text-lg focus:border-lime-400/50" />
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic text-xl shadow-xl active:scale-95 transition-transform">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {/* FORMULARIO PASO 2: REGISTRO GLOBAL */}
                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4 animate-in slide-in-from-right">
                        <div className="text-center mb-6">
                            <p className="text-sm opacity-60 font-bold italic uppercase tracking-widest">Crea tu cuenta de jugador</p>
                        </div>
                        <div className="relative">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required type="password" placeholder="CONTRASEÑA" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                        </div>
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] uppercase italic text-xl mt-4 shadow-xl active:scale-95 transition-transform">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "REGISTRARME"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;