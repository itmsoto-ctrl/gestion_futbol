import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import API_BASE_URL from '../../../apiConfig';

const NukeButton = () => {
    const [loading, setLoading] = useState(false);

    const handleNuke = async () => {
        // Doble confirmación por si las moscas
        const confirm1 = window.confirm("⚠️ ¡CUIDADO! Esto borrará TODAS las ligas, equipos, partidos y jugadores apuntados. ¿Estás seguro?");
        if (!confirm1) return;

        const confirm2 = window.confirm("🚨 ¿100% SEGURO? Esta acción es irreversible.");
        if (!confirm2) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/leagues/nuke-database`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert("💥 ¡BOOM! Base de datos reiniciada. Todo limpio.");
                window.location.reload(); // Recarga la página para limpiar el Dashboard
            } else {
                const data = await response.json();
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert("Error de conexión al intentar borrar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-12 p-6 bg-red-950/20 border border-red-900/50 rounded-[2rem] flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
            <div className="flex items-center gap-2 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black uppercase italic">Zona de Pruebas</h3>
            </div>
            <p className="text-sm text-red-400/70 text-center font-medium">
                Utiliza este botón solo en desarrollo para limpiar las tablas de ligas, equipos, jugadores y partidos. Los IDs volverán a empezar desde 1.
            </p>
            <button 
                onClick={handleNuke}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black px-6 py-4 rounded-2xl uppercase tracking-widest flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <AlertTriangle size={20} />}
                Resetear Base de Datos
            </button>
        </div>
    );
};

export default NukeButton;