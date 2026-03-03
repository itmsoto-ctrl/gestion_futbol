import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Save, UploadCloud, Loader2 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const EditTeamModal = ({ team, onClose, onUpdate }) => {
  const [phone, setPhone] = useState(team.captain_phone || '');
  const [logo, setLogo] = useState(team.logo || ''); 
  const [preview, setPreview] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
  
    setPreview(URL.createObjectURL(file));
    setUploading(true);
  
    const url = `https://api.cloudinary.com/v1_1/dqoplz61y/image/upload`;
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
  
    xhr.open("POST", url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
  
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        setUploading(false);
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            console.log("✅ Cloudinary URL:", response.secure_url);
            setLogo(response.secure_url); // Guardamos la URL para el Save
          } else {
            alert("Error Cloudinary: " + response.error.message);
          }
        } catch (e) {
          console.error("Error parseando respuesta", e);
        }
      }
    };
  
    fd.append("upload_preset", "vora_players");
    fd.append("file", file);
    xhr.send(fd);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  // Dentro de la función handleSave en EditTeamModal.jsx
const handleSave = async () => {
  if (uploading) return;
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/leagues/teams/${team.id}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ 
        captain_phone: phone, 
        logo_url: logo 
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Servidor respondió OK:", data);
      onUpdate(); // Refresca Dashboard
      onClose();   // Cierra Modal
    } else {
      alert("Error del servidor: " + data.error);
    }
  } catch (error) {
    console.error("Error de red:", error);
    alert("Fallo de conexión al servidor");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-[3rem] p-8 border border-zinc-800 shadow-2xl">
        <div {...getRootProps()} className={`relative h-44 mb-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${isDragActive ? 'border-lime-400 bg-lime-400/10' : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'}`}>
          <input {...getInputProps()} />
          {uploading && <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center"><Loader2 className="text-lime-400 animate-spin" size={32} /></div>}
          {preview || logo ? (
            <img src={preview || logo} alt="Preview" className="w-full h-full object-contain p-4" />
          ) : (
            <div className="text-center">
              <UploadCloud className="text-zinc-700 mx-auto mb-2" size={32} />
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Suelta el escudo aquí</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <input type="tel" placeholder="WhatsApp del capitán" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-zinc-950 p-5 rounded-3xl border border-zinc-800 outline-none focus:border-lime-400 text-white font-bold" />
          <button onClick={handleSave} disabled={loading || uploading} className="w-full bg-lime-400 text-zinc-950 font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 uppercase italic shadow-xl disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Guardar Cambios</>}
          </button>
          <button onClick={onClose} className="w-full text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-2 hover:text-white transition-colors">Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default EditTeamModal;