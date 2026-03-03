import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, User, Lock, Loader2, CheckCircle, ClipboardList, Hash, CreditCard } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); // 1: Email, 2: Registro Users, 3: Datos Liga, 4: Éxito
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [fieldsConfig, setFieldsConfig] = useState({});
    
    // Datos de Formulario
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [dni, setDni] = useState('');

    const logoUrl = "/logo-shine.webp";

    // 1. CARGAR INFO DEL EQUIPO Y CONFIGURACIÓN
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setTeamInfo(data.team);
                    setFieldsConfig(data.fieldsConfig || {});
                }
            } catch (err) { console.error("Error cargando equipo:", err); }
        };
        fetchTeam();
    }, [token]);

    // LÓGICA DE INSERCIÓN EN LEAGUE_PLAYERS
    const handleJoinLeague = async (userEmail, userFullName, userDni = null, userDorsal = null) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/leagues/register-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    fullName: userFullName,
                    teamId: teamInfo.id,
                    dorsal: userDorsal,
                    dni: userDni
                })
            });

            if (res.ok) {
                setStep(4); // Éxito Final
            } else {
                const error = await res.json();
                alert(error.error || "Error al unirse al equipo");
            }
        } catch (err) {
            alert("Error vinculando con el equipo");
        } finally {
            setLoading(false);
        }
    };

    // 2. PASO 1: VERIFICAR EMAIL
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
                // SI EXISTE: Comprobamos si el admin pide datos
                if (fieldsConfig.dni || fieldsConfig.dorsal) {
                    setName(data.name || ''); // Guardamos el nombre que ya tiene para el insert final
                    setStep(3);
                } else {
                    await handleJoinLeague(email, data.name || 'JUGADOR');
                }
            } else {
                setStep(2); // Usuario nuevo
            }
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    // 3. PASO 2: CREAR USUARIO EN 'USERS'
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
                // TRAS CREAR USER: ¿Hay campos extras?
                if (fieldsConfig.dni || fieldsConfig.dorsal) {
                    setStep(3);
                } else {
                    await handleJoinLeague(email, name);
                }
            } else {
                const error = await res.json();
                alert(error.error || "Error al crear la cuenta");
            }
        } catch (err) { alert("Fallo en el servidor"); }
        finally { setLoading(false); }
    };

    // 4. PASO 3: FORMULARIO DINÁMICO DE LIGA
    const handleLeagueDataSubmit = async (e) => {
        e.preventDefault();
        await handleJoinLeague(email, name, dni, dorsal);
    };

    // VISTA DE ÉXITO FINAL
    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white font-sans italic">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">¡FICHAJE COMPLETADO!</h1>
            <p className="mt-4 opacity-70 uppercase text-xs font-bold tracking-widest">Ya formas parte de {teamInfo?.teamName}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            
            <div className="mt-8 mb-6 relative logo-container-shine">
                <div className="logo-shine-overlay" style={{ "--logo-url": `url(${logoUrl})` }} />
                <img src={logoUrl} alt="VORA" className="logo-main-shine" />
            </div>

            {teamInfo && step < 4 && (
                <div className="w-full max-w-sm mb-10 text-center animate-in fade-in duration-700">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-lime-400 mb-2 font-black">
                        {step === 3 ? "DATOS REQUERIDOS" : "INVITACIÓN RECIBIDA PARA:"}
                    </p>
                    <h2 className="text-white text-3xl font-black italic uppercase leading-none tracking-tighter truncate">
                        {teamInfo.teamName}
                    </h2>
                </div>
            )}

            <div className="w-full max-w-sm">
                {/* SLIDE 1: EMAIL */}
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold text-lg" />
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic text-xl shadow-xl active:scale-95 transition-transform">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {/* SLIDE 2: REGISTRO USERS */}
                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4 animate-in slide-in-from-right">
                        <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <input required type="password" placeholder="CONTRASEÑA VORA" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] uppercase italic text-xl mt-4 active:scale-95 shadow-xl">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CREAR CUENTA"}
                        </button>
                    </form>
                )}

                {/* SLIDE 3: DATOS LIGA (DORSAL/DNI) */}
                {step === 3 && (
                    <form onSubmit={handleLeagueDataSubmit} className="space-y-4 animate-in slide-in-from-right">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 mb-4 text-center">
                            <ClipboardList className="mx-auto text-lime-400 mb-2" size={24} />
                            <p className="text-xs font-bold text-white/60 uppercase italic">Información para la liga</p>
                        </div>
                        {fieldsConfig.dorsal && (
                            <div className="relative">
                                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required type="number" placeholder="DORSAL" value={dorsal} onChange={(e) => setDorsal(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                            </div>
                        )}
                        {fieldsConfig.dni && (
                            <div className="relative">
                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required placeholder="DNI / NIE" value={dni} onChange={(e) => setDni(e.target.value.toUpperCase())}
                                    className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                            </div>
                        )}
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic text-xl mt-4 active:scale-95">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "FINALIZAR FICHAJE"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;