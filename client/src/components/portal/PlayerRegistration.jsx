import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { User, Mail, Lock, CreditCard, Hash, Camera, CheckCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
  const { token } = useParams();
  const [step, setStep] = useState(1); // 1: Email, 2: Registro/Login, 3: Carta/Foto, 4: Éxito
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [adminConfig, setAdminConfig] = useState({});
  const [teamInfo, setTeamInfo] = useState(null);
  
  // Estados de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [dni, setDni] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Cargar configuración de la liga al entrar
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
        const data = await res.json();
        if (res.ok) {
          setAdminConfig(data.fieldsConfig || {});
          setTeamInfo(data.team);
        }
      } catch (err) { console.error("Error cargando config", err); }
    };
    fetchConfig();
  }, [token]);

  // VALIDAR EMAIL
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Aquí llamarías a una ruta de tu API para checkear si el email existe
      const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setUserExists(data.exists);
      setStep(2);
    } catch (err) { alert("Error al conectar"); }
    finally { setLoading(false); }
  };

  // REGISTRO O LOGIN Y PASAR A LA FOTO
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Aquí iría la lógica de login o registro en la tabla 'users'
    // Por ahora simulamos éxito y pasamos al cromo
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 1000);
  };

  // SUBIDA DE FOTO (SELFIE)
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploading(true);
      const data = new FormData();
      data.append('file', file);
      data.append('upload_preset', 'vora_players');
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
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center italic font-black uppercase">
        <CheckCircle size={80} className="text-lime-400 mb-4 animate-bounce" />
        <h1 className="text-3xl text-white italic tracking-tighter">¡Fichaje Estrella <br/> <span className="text-lime-400 font-black tracking-widest">Confirmado!</span></h1>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-6 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">VORA <span className="text-lime-400 text-3xl">PORTAL</span></h2>
      </header>

      {/* PASO 1: EMAIL */}
      {step === 1 && (
        <form onSubmit={handleCheckEmail} className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
          <p className="text-center text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-4">Introduce tu email para comenzar</p>
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input 
              required type="email" placeholder="TU EMAIL AQUÍ" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 italic">
            {loading ? <Loader2 className="animate-spin"/> : <>CONTINUAR <ArrowRight size={20}/></>}
          </button>
        </form>
      )}

      {/* PASO 2: REGISTRO / LOGIN */}
      {step === 2 && (
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4 animate-in slide-in-from-right-10">
          <p className="text-center text-lime-400 font-black uppercase text-[10px] tracking-widest mb-4">
            {userExists ? "¡TE HEMOS ENCONTRADO! ENTRA:" : "NUEVO FICHAJE: COMPLETA TU PERFIL"}
          </p>
          
          {!userExists && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
              <input required placeholder="NOMBRE COMPLETO" value={fullName} onChange={(e) => setFullName(e.target.value.toUpperCase())}
              className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500" />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input required type="password" placeholder="TU CONTRASEÑA" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500" />
          </div>

          {!userExists && (
            <div className="grid grid-cols-2 gap-3">
               <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                <input required placeholder="DORSAL" value={dorsal} onChange={(e) => setDorsal(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500" />
              </div>
              {adminConfig.dni && (
                <div className="relative">
                  <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                  <input required placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold placeholder:text-zinc-500" />
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 italic">
            {loading ? <Loader2 className="animate-spin"/> : <>{userExists ? "ENTRAR" : "REGISTRARME"} <ArrowRight size={20}/></>}
          </button>
        </form>
      )}

      {/* PASO 3: LA CARTA FUT TEAM (LA PARTE "GUAPA") */}
      {step === 3 && (
        <div className="w-full max-w-sm flex flex-col items-center animate-in zoom-in-95">
          <div className="text-center mb-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter">CREA TU <span className="text-lime-400">CARTA OFICIAL</span></h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Hazte un selfie para el cromo de la liga</p>
          </div>

          {/* DISEÑO DEL CROMO FUT */}
          <div className="relative w-64 h-80 bg-gradient-to-b from-lime-400 to-lime-600 rounded-[2rem] p-1 shadow-[0_0_50px_rgba(163,230,53,0.3)]">
             <div className="bg-zinc-950 w-full h-full rounded-[1.8rem] overflow-hidden relative flex flex-col items-center justify-center border border-lime-400/50">
                {photoUrl ? (
                  <img src={photoUrl} className="w-full h-full object-cover" alt="Selfie" />
                ) : (
                  <div {...getRootProps()} className="flex flex-col items-center cursor-pointer p-4 text-center">
                    <input {...getInputProps()} capture="user" />
                    <div className="w-16 h-16 bg-lime-400 rounded-full flex items-center justify-center mb-4 animate-pulse shadow-lg">
                      <Camera className="text-zinc-950" size={32} />
                    </div>
                    <p className="text-[10px] font-black uppercase text-white leading-tight italic">TOCA AQUÍ PARA <br/> ACTIVAR LA CÁMARA</p>
                  </div>
                )}
                
                {/* Overlay de Datos en el Cromo */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black italic text-lime-400 leading-none">{dorsal || '00'}</span>
                    <div className="mb-1">
                       <p className="text-xs font-black uppercase italic leading-none">{fullName || 'TU NOMBRE'}</p>
                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{teamInfo?.teamName || 'TU EQUIPO'}</p>
                    </div>
                  </div>
                </div>
             </div>
             <Sparkles className="absolute -top-4 -right-4 text-lime-400 animate-pulse" size={32} />
          </div>

          <button 
            onClick={() => setStep(4)}
            disabled={!photoUrl || uploading}
            className="w-full mt-8 bg-white text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 italic shadow-xl disabled:opacity-30"
          >
            {uploading ? <Loader2 className="animate-spin"/> : <>FINALIZAR MI FICHA <CheckCircle size={20}/></>}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlayerRegistration;