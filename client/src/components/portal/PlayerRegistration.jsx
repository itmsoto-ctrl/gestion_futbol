import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';
import LeagueDataForm from './LeagueDataForm'; 

const PlayerRegistration = () => {
    const { token } = useParams();
    const [step, setStep] = useState(1); // 1: Email, 2: Registro Users, 3: Datos Liga, 4: Éxito
    const [loading, setLoading] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [fieldsConfig, setFieldsConfig] = useState({});
    
    // Datos de Usuario Global (Tabla users)
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [dni, setDni] = useState('');
    const [phone, setPhone] = useState('');

    // Datos Específicos de Liga (Tabla league_players)
    const [dorsal, setDorsal] = useState('');
    const [age, setAge] = useState('');

    const logoUrl = "/logo-shine.webp";

    // 1. CARGAR CONTEXTO DEL EQUIPO
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
                const data = await res.json();
                if (res.ok) {
                    setTeamInfo(data.team);
                    // IMPORTANTE: Mapeo directo del JSON de tu base de datos
                    setFieldsConfig(data.fieldsConfig || {});
                }
            } catch (err) { console.error("Error cargando equipo:", err); }
        };
        fetchTeam();
    }, [token]);

    // 2. LÓGICA DE EVALUACIÓN (Confrontar requisitos vs datos existentes)
    const evaluateNextStep = (userData = null) => {
        // Campos que pide el admin en el JSON de la liga
        const needsDorsal = fieldsConfig.number; // En tu DB se llama 'number'
        const needsDni = fieldsConfig.dni;
        const needsPhone = fieldsConfig.phone;
        const needsAge = fieldsConfig.age;

        // Datos que ya tenemos del usuario
        const currentDni = userData?.dni || dni;
        const currentPhone = userData?.phone || phone;

        // Decisión: ¿Falta algo de lo solicitado?
        const missingSomething = 
            needsDorsal || 
            (needsDni && !currentDni) || 
            (needsPhone && !currentPhone) || 
            needsAge;

        if (missingSomething) {
            setStep(3); // Vamos al Área de Inscripción
        } else {
            // Fichaje Directo (Ej. Liga 28 que solo pide fullName)
            handleJoinLeague(email, userData?.name || name, currentDni, null, currentPhone, null);
        }
    };

    // 3. PASO 1: CHEQUEAR EMAIL
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
                // Sincronizamos lo que ya existe en la tabla users
                setName(data.name || '');
                setDni(data.dni || '');
                setPhone(data.phone || '');
                evaluateNextStep(data);
            } else {
                setStep(2); // Usuario nuevo: registrar cuenta
            }
        } catch (err) { alert("Error de conexión"); }
        finally { setLoading(false); }
    };

    // 4. PASO 2: CREAR USUARIO BASE
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
                alert("Error al crear la cuenta de usuario");
            }
        } catch (err) { alert("Fallo de red"); }
        finally { setLoading(false); }
    };

    // 5. VINCULACIÓN FINAL (Insert en league_players)
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
            if (res.ok) setStep(4);
            else {
                const errorData = await res.json();
                alert(errorData.error || "Error al procesar el fichaje");
            }
        } catch (err) { alert("Error de comunicación"); }
        finally { setLoading(false); }
    };

    // VISTA DE ÉXITO
    if (step === 4) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white italic animate-in zoom-in">
            <CheckCircle size={80} className="text-lime-400 mb-6 drop-shadow-xl" />
            <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">¡FICHAJE <br/> COMPLETADO!</h1>
            <p className="mt-4 opacity-70 uppercase text-xs font-bold tracking-[0.2em]">Bienvenido a {teamInfo?.teamName}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans overflow-x-hidden">
            
            {/* Cabecera Adaptable */}
            {step < 3 ? (
                <div className="mt-8 mb-6 relative logo-container-shine">
                    <div className="logo-shine-overlay" style={{ "--logo-url": `url(${logoUrl})` }} />
                    <img src={logoUrl} alt="VORA" className="logo-main-shine" />
                </div>
            ) : (
                <div className="mt-12 mb-10 text-center italic">
                    <h1 className="text-2xl font-black italic tracking-[0.3em] text-white/20 uppercase">VORA</h1>
                </div>
            )}

            <div className="w-full max-w-sm">
                
                {/* PASO 1: IDENTIFICACIÓN */}
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6 animate-in fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{teamInfo?.teamName}</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400 mt-2">Acceso Jugador</p>
                        </div>
                        <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {/* PASO 2: REGISTRO (Solo si es nuevo) */}
                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4 animate-in slide-in-from-right">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-lime-400">Crear Cuenta</h2>
                            <p className="text-[10px] font-bold uppercase text-white/40 italic">Bienvenido al ecosistema VORA</p>
                        </div>
                        <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <input required type="password" placeholder="CONTRASEÑA" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] uppercase italic shadow-xl mt-4">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "REGISTRARME"}
                        </button>
                    </form>
                )}

                {/* PASO 3: ÁREA DE INSCRIPCIÓN (Mediante componente hijo) */}
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