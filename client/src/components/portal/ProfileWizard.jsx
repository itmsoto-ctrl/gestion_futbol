import React, { useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import FutCard from '../FutCard';

const ProfileWizard = ({ user, tempPhoto, onStartCamera, onSave, uploading }) => {
    const [isFlipped, setIsFlipped] = useState(!user?.photo_url); // Girada si es nuevo
    const [editData, setEditData] = useState({
        name: user?.name || '',
        position: user?.position || 'DEL',
        country: user?.country_code || 'es'
    });

    return (
        <div className="flex flex-col items-center">
            <FutCard 
                player={{ ...user, ...editData, photo_url: tempPhoto || user?.photo_url }} 
                isFlipped={isFlipped}
                onFlip={() => setIsFlipped(!isFlipped)} // 👈 Giro táctil
                size="large"
            >
                {/* FORMULARIO TRASERO */}
                <div className="p-8 pt-14 space-y-6 flex flex-col h-full text-amber-950">
                    <h3 className="text-center font-black italic uppercase tracking-widest text-sm border-b border-amber-950/10 pb-2">Ficha Técnica</h3>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Nombre</label>
                        <input type="text" maxLength={12} value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full bg-amber-950/5 border border-amber-950/10 rounded-xl py-3 px-4 font-bold uppercase outline-none" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-1">Posición</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['PO', 'DFC', 'MC', 'DEL'].map(pos => (
                                <button key={pos} onClick={() => setEditData({...editData, position: pos})} className={`py-2 rounded-lg font-black text-xs ${editData.position === pos ? 'bg-amber-950 text-white' : 'bg-amber-950/5'}`}>{pos}</button>
                            ))}
                        </div>
                    </div>

                    <button onClick={() => onSave(editData)} disabled={uploading} className="w-full bg-amber-950 text-white font-black py-4 rounded-xl mt-auto shadow-lg active:scale-95 transition-all">
                        {uploading ? <Loader2 className="animate-spin mx-auto" /> : "GUARDAR FICHA"}
                    </button>
                </div>
            </FutCard>

            {/* BOTÓN CÁMARA FLOTANTE (Solo visible de frente) */}
            {!isFlipped && (
                <button onClick={onStartCamera} className="mt-8 bg-lime-400 text-black p-5 rounded-full shadow-2xl animate-bounce">
                    <Camera size={30} />
                </button>
            )}
        </div>
    );
};

export default ProfileWizard;