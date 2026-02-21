import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user, onLogout }) => {
    const [tournaments, setTournaments] = useState([]);
    const [name, setName] = useState('');
    const [type, setType] = useState('campeonato');
    const navigate = useNavigate();
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    useEffect(() => {
        axios.get(`${API_URL}/tournaments`).then(res => setTournaments(res.data));
    }, []);

    const handleCreate = async () => {
        if (!name) return alert("Nombre obligatorio");
        await axios.post(`${API_URL}/tournaments`, { name, type });
        window.location.reload();
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '500px', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Mis Torneos</h2>
                <button onClick={onLogout} style={{ padding: '5px 10px' }}>Cerrar</button>
            </div>
            
            {user.role === 'admin' && (
                <div style={{ background: '#eee', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                    <h4>Crear Nuevo Torneo</h4>
                    <input placeholder="Nombre" onChange={e => setName(e.target.value)} style={{ width: '90%', padding: '10px', marginBottom: '10px' }} />
                    <select onChange={e => setType(e.target.value)} style={{ width: '97%', padding: '10px', marginBottom: '10px' }}>
                        <option value="campeonato">Campeonato (8 eq)</option>
                        <option value="liga">Liga (6 eq)</option>
                    </select>
                    <button onClick={handleCreate} style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px' }}>CREAR</button>
                </div>
            )}

            {tournaments.map(t => (
                <div key={t.id} onClick={() => navigate(`/tournament/${t.id}`)} style={{ padding: '20px', background: '#fff', border: '1px solid #ddd', borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {t.name} ({t.type.toUpperCase()})
                </div>
            ))}
        </div>
    );
};
export default AdminPanel;