import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { User, Hash, CreditCard, Camera, CheckCircle, ArrowRight, Loader2, UploadCloud } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
  const { token } = useParams();
  const [step, setStep] = useState(1); // 1: Registro, 2: Éxito
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    dorsal: '',
    dni: '',
    photoUrl: ''
  });

  // Lógica de subida de foto del jugador a Cloudinary
  // Sustituye la función onDrop en PlayerRegistration.jsx por esta:

const onDrop = useCallback(async (acceptedFiles) => {
  const file = acceptedFiles[0];
  if (file) {
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'vora_players'); // Asegúrate que este nombre es exacto

    try {
      // 🚨 USAMOS UN FETCH LIMPIO SIN HEADERS
      const res = await fetch(`https://api.cloudinary.com/v1_1/dqoplz61y/image/upload`, {
        method: 'POST',
        // IMPORTANTE: No añadas 'headers' aquí. 
        // Ni 'Content-Type' ni 'Authorization'.
        body: data,
      });

      const fileData = await res.json();
      
      if (!res.ok) {
        console.error("❌ Error Cloudinary:", fileData.error.message);
        alert(`Fallo en la foto: ${fileData.error.message}`);
        return;
      }

      if (fileData.secure_url) {
        console.log("✅ Foto subida:", fileData.secure_url);
        setFormData(prev => ({ ...prev, photoUrl: fileData.secure_url }));
      }
    } catch (err) {
      console.error("Error de red:", err);
    } finally {
      setUploading(false);
    }
  }
}, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return;
    setLoading(true);
    
    try {
      // 1. Buscamos info del equipo por el token
      const portalRes = await fetch(`${API_BASE_URL}/api/leagues/team-portal/${token}`);
      const portalData = await portalRes.json();
      
      if (!portalRes.ok) throw new Error("Equipo no válido");

      // 2. Registramos al jugador en la base de datos
      const res = await fetch(`${API_BASE_URL}/api/leagues/register-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: portalData.team.id,
          full_name: formData.fullName,
          dorsal: formData.dorsal,
          dni: formData.dni,
          photo_url: formData.photoUrl, // Guardamos la URL de Cloudinary
          is_pwa: 1
        })
      });

      if (res.ok) setStep(2);
      else throw new Error("Error en el registro");

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-xs animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(163,230,53,0.3)]">
            <CheckCircle size={40} className="text-zinc-950" />
          </div>
          <h1 className="text-2xl font-black uppercase italic text-white mb-2">Fichaje <span className="text-lime-400">Confirmado</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[9px] tracking-[0.2em]">Ya apareces en la plantilla oficial del equipo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col items-center py-12 px-6">
      <div className="w-full max-w-sm">
        <header className="mb-10 text-center">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">VORA <span className="text-lime-400">PLAYER</span></h2>
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">Inscripción Oficial de Jugadores</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FOTO DEL JUGADOR */}
          <div {...getRootProps()} className={`relative h-48 rounded-[2.5rem] border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center bg-zinc-900/50 
            ${isDragActive ? 'border-lime-400' : 'border-zinc-800'}`}>
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" alt="Tu foto" />
            ) : (
              <div className="text-center px-6">
                <Camera className="mx-auto mb-2 text-zinc-700" size={32} />
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest leading-tight">Sube o hazte una foto <br/><span className="text-lime-400/50">Obligatorio</span></p>
              </div>
            )}
            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 className="text-lime-400 animate-spin" /></div>}
          </div>

          {/* NOMBRE */}
          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-lime-400 transition-colors" size={18} />
            <input 
              required
              placeholder="NOMBRE Y APELLIDOS"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value.toUpperCase()})}
              className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold italic transition-all placeholder:text-zinc-700"
            />
          </div>

          {/* DORSAL Y DNI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                required
                type="number"
                placeholder="Nº"
                value={formData.dorsal}
                onChange={(e) => setFormData({...formData, dorsal: e.target.value})}
                className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold transition-all placeholder:text-zinc-700"
              />
            </div>
            <div className="relative group">
              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
              <input 
                required
                placeholder="DNI"
                value={formData.dni}
                onChange={(e) => setFormData({...formData, dni: e.target.value.toUpperCase()})}
                className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-3xl outline-none focus:border-lime-400 font-bold transition-all placeholder:text-zinc-700"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-lime-400 text-zinc-950 font-black py-6 rounded-[2rem] text-lg uppercase italic shadow-[0_10px_30px_rgba(163,230,53,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>FICHA COMPLETADA <ArrowRight size={20} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerRegistration;