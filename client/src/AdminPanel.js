import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = ({ user, onLogout }) => {
    const [tournaments, setTournaments] = useState([]);
    const [name, setName] = useState('');
    const [type, setType] = useState('campeonato');

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        const res = await axios.get('http://localhost:3001/tournaments');
        setTournaments(res.data);
    };

    const handleCreate = async () => {
        if (!name) return alert("Ponle un nombre");
        await axios.post('http://localhost:3001/tournaments', { name, type });
        setName('');
        fetchTournaments();
    };

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h1>Panel de {user.role}</h1>
                <button onClick={onLogout}>Cerrar Sesión</button>
            </div>

            {user.role === 'admin' && (
                <div style={{ background: '#eee', padding: '15px', borderRadius: '8px' }}>
                    <h3>Crear Nuevo Campeonato/Liga</h3>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del torneo" />
                    <select onChange={e => setType(e.target.value)}>
                        <option value="campeonato">Campeonato (30 min - 8 equipos)</option>
                        <option value="liga">Liga (1h - 6 equipos)</option>
                    </select>
                    <button onClick={handleCreate}>Crear</button>
                </div>
            )}

            <h3>Torneos Existentes</h3>
            <div style={{ display: 'grid', gap: '10px' }}>
                {tournaments.map(t => (
                    <div key={t.id} style={{ padding: '10px', border: '1px solid #ccc' }}>
                        <strong>{t.name}</strong> ({t.type})
                        <button onClick={() => window.location.href=`/tournament/${t.id}`} style={{ marginLeft: '10px' }}>
                            Entrar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminPanel;