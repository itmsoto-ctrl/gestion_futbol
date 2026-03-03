import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import LeagueDataForm from './LeagueDataForm'; 

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); // 1: Email, 2: Registro, 3: Form Liga, 4: Éxito
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Anti-duplicados
    const [teamInfo, setTeamInfo] = useState(null);
    const [fieldsConfig, setFieldsConfig] = useState({});
    
    // Estados de datos
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');
    const [dorsal, setDorsal] = useState('');
    const [age, setAge] = useState('');

    const logoUrl = "/logo-shine.webp";

    // 1. CARGAR CONTEXTO
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

    // 2. LÓGICA DE DECISIÓN (Solo se dispara por acciones del usuario)
    const determineNextStep = (userData = null) => {
        const needsDorsal = fieldsConfig.number;
        const needsDni = fieldsConfig.dni && !(userData?.dni || dni);
        const needsPhone = fieldsConfig.phone && !(userData?.phone || phone);
        const needsAge = fieldsConfig.age;

        // Si falta cualquier dato requerido por el admin, vamos al componente de liga
        if (needsDorsal || needsDni || needsPhone || needsAge) {
            setStep(3);
        } else {
            // Si ya está todo, fichaje directo
            handleJoinLeague(
                email, 
                userData?.name || name, 
                userData?.dni || dni, 
                null, 
                userData?.phone || phone, 
                null
            );
        }
    };

    // 3. PASO 1: CHECK EMAIL
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
                // Pre-cargamos datos para la evaluación
                setName(data.name || '');
                setDni(data.dni || '');
                setPhone(data.phone || '');
                determineNextStep(data);
            } else {
                setStep(2);
            }
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    // 4. PASO 2: REGISTRO BASE (Protegido contra doble clic)
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register-basic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password })
            });
            if (res.ok) {
                determineNextStep();
            } else {
                const err = await res.json();
                alert(err.message || "Error al crear cuenta");
            }
        } catch (err) { alert("Fallo de red"); }
        finally { 
            setLoading(false);
            setIsSubmitting(false); 
        }
    };

    // 5. PASO 3: FICHAJE FINAL
    const handleJoinLeague = async (uEmail, uName, uDni, uDorsal, uPhone, uAge) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/leagues/register-player-full`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: uEmail,
                    fullName: uName,
                    teamId: teamInfo.id,
                    dorsal: uDorsal || null,
                    dni: uDni || null,
                    phone: uPhone || null,
                    age: uAge || null
                })
            });
            if (res.ok) {
                // Guardamos el email para que el PlayerHome sepa quién es el usuario
                localStorage.setItem('userEmail', uEmail);
                setStep(4);
            } else {
                alert("Error al procesar la ficha del equipo");
            }
        } catch (err) { alert("Error de servidor"); }
        finally { setLoading(false); }
    };

    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white italic">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none italic">¡REGISTRO <br/> EXITOSO!</h1>
            <p className="mt-4 opacity-70 uppercase text-xs font-bold tracking-widest">Ya estás dentro de {teamInfo?.teamName}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            
            {/* Logo dinámico: desaparece en el formulario de inscripción */}
            {step < 3 ? (
                <div className="mt-8 mb-6 relative logo-container-shine">
                    <div className="logo-shine-overlay" style={{ "--logo-url": `url(${logoUrl})` }} />
                    <img src={logoUrl} alt="VORA" className="logo-main-shine" />
                </div>
            ) : (
                <div className="mt-12 mb-10 text-center uppercase tracking-[0.3em] font-black italic text-white/20">
                    VORA
                </div>
            )}

            <div className="w-full max-w-sm">
                
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{teamInfo?.teamName}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400 mt-2 italic font-black">Identificación Jugador</p>
                        </div>
                        <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4 animate-in slide-in-from-right">
                        <div className="text-center mb-6 font-black italic">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-lime-400 italic">Crear Cuenta</h2>
                            <p className="text-[10px] font-bold uppercase text-white/40 tracking-widest mt-2">Bienvenido a la red VORA</p>
                        </div>
                        <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <input required type="password" placeholder="CONTRASEÑA" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" disabled={loading} className={`w-full ${loading ? 'bg-gray-500' : 'bg-white'} text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl mt-4 transition-all`}>
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "FINALIZAR REGISTRO"}
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={(e) => { 
                        e.preventDefault(); 
                        handleJoinLeague(email, name, dni, dorsal, phone, age); 
                    }}>
                        <LeagueDataForm 
                            fieldsConfig={fieldsConfig}
                            dorsal={dorsal} setDorsal={setDorsal}
                            dni={dni} setDni={setDni}
                            phone={phone} setPhone={setPhone}
                            age={age} setAge={setAge}
                            loading={loading}
                            teamName={teamInfo?.teamName}
                        />
                    </form>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;