import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, User, Lock, Loader2, CheckCircle, ClipboardList, Hash, CreditCard, Phone, Calendar } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [fieldsConfig, setFieldsConfig] = useState({});
    
    // Datos de Formulario
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');

    const logoUrl = "/logo-shine.webp";

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setTeamInfo(data.team);
                    // Importante: Aseguramos que fieldsConfig sea un objeto
                    setFieldsConfig(data.fieldsConfig || {});
                }
            } catch (err) { console.error("Error cargando equipo:", err); }
        };
        fetchTeam();
    }, [token]);

    // Función para decidir si saltar al Step 3 o ir directo al Fichaje
    const evaluateNextStep = (userData = null) => {
        // Campos que pide el admin
        const needsDni = fieldsConfig.dni;
        const needsDorsal = fieldsConfig.dorsal;
        const needsPhone = fieldsConfig.phone;

        // Si el usuario ya existe y tiene los datos, o si el admin no pide nada
        const hasDni = userData?.dni || dni;
        const hasPhone = userData?.phone || phone;

        // Si falta algo de lo que pide el admin, vamos al Step 3
        if ((needsDni && !hasDni) || (needsDorsal && !dorsal) || (needsPhone && !hasPhone)) {
            setStep(3);
        } else {
            // Si tiene todo, fichaje directo
            handleJoinLeague(email, userData?.name || name, hasDni, dorsal, hasPhone);
        }
    };

    const handleJoinLeague = async (uEmail, uName, uDni, uDorsal, uPhone) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/leagues/register-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: uEmail,
                    fullName: uName,
                    teamId: teamInfo.id,
                    dorsal: uDorsal,
                    dni: uDni,
                    phone: uPhone
                })
            });
            if (res.ok) setStep(4);
            else alert("Error al procesar el fichaje");
        } catch (err) { alert("Error de red"); }
        finally { setLoading(false); }
    };

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
                // Si existe, guardamos lo que ya sabemos de él
                setName(data.name || '');
                setDni(data.dni || '');
                setPhone(data.phone || '');
                evaluateNextStep(data);
            } else {
                setStep(2);
            }
        } catch (err) { alert("Error"); }
        finally { setLoading(false); }
    };

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
                evaluateNextStep();
            } else {
                alert("Error creando cuenta");
            }
        } catch (err) { alert("Error"); }
        finally { setLoading(false); }
    };

    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white italic">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-black uppercase tracking-tighter italic">¡FICHAJE COMPLETADO!</h1>
            <p className="mt-4 opacity-70 uppercase text-xs font-bold">Bienvenido a {teamInfo?.teamName}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            <div className="mt-8 mb-6 relative logo-container-shine">
                <div className="logo-shine-overlay" style={{ "--logo-url": `url(${logoUrl})` }} />
                <img src={logoUrl} alt="VORA" className="logo-main-shine" />
            </div>

            {teamInfo && step < 4 && (
                <div className="w-full max-w-sm mb-10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-lime-400 mb-2">
                        {step === 3 ? "DATOS DE LIGA" : "INVITACIÓN RECIBIDA"}
                    </p>
                    <h2 className="text-white text-3xl font-black italic uppercase leading-none tracking-tighter truncate">
                        {teamInfo.teamName}
                    </h2>
                </div>
            )}

            <div className="w-full max-w-sm">
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                            <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                        </div>
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4 animate-in slide-in-from-right">
                        <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <input required type="password" placeholder="CONTRASEÑA VORA" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl mt-4">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CREAR CUENTA"}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={(e) => { e.preventDefault(); handleJoinLeague(email, name, dni, dorsal, phone); }} className="space-y-4 animate-in slide-in-from-right">
                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 mb-4 text-center">
                            <ClipboardList className="mx-auto text-lime-400 mb-2" size={24} />
                            <p className="text-xs font-bold text-white/60 uppercase italic">Faltan datos requeridos</p>
                        </div>
                        
                        {fieldsConfig.dorsal && (
                            <div className="relative">
                                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required type="number" placeholder="DORSAL" value={dorsal} onChange={(e) => setDorsal(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                            </div>
                        )}
                        
                        {fieldsConfig.dni && !dni && (
                            <div className="relative">
                                <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required placeholder="DNI / NIE" value={dni} onChange={(e) => setDni(e.target.value.toUpperCase())}
                                    className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                            </div>
                        )}

                        {fieldsConfig.phone && !phone && (
                            <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                                <input required placeholder="TELÉFONO" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 p-5 pl-16 rounded-[2rem] outline-none font-bold" />
                            </div>
                        )}

                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic mt-4">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "FINALIZAR FICHAJE"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;