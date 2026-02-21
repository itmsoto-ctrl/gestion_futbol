import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user, onLogout }) => {
    const [tournaments, setTournaments] = useState([]);
    const navigate = useNavigate();
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    useEffect(() => {
        axios.get(`${API_URL}/tournaments`).then(res => {
            setTournaments(res.data);
            // REDIRECCIÓN AUTOMÁTICA SI SOLO HAY UNO
            if (res.data.length === 1) {
                navigate(`/tournament/${res.data[0].id}`);
            }
        });
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h2>Panel de Torneos</h2>
                <button onClick={onLogout}>Cerrar Sesión</button>
            </div>
            {tournaments.map(t => (
                <button key={t.id} onClick={() => navigate(`/tournament/${t.id}`)} style={{ display: 'block', width: '100%', padding: '15px', margin: '10px 0' }}>
                    {t.name} ({t.type})
                </button>
            ))}
        </div>
    );
};
export default AdminPanel;