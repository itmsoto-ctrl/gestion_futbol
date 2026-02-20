import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
    const [form, setForm] = useState({ username: '', password: '' });
    const navigate = useNavigate();
    const API_URL = "https://gestionfutbol-production.up.railway.app";

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/login`, form);
            onLogin(res.data);
            navigate('/dashboard');
        } catch (error) { alert("Error"); }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '20px' }}>
            <div style={{ background: '#fff', padding: '40px 20px', borderRadius: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ fontSize: '60px' }}>🏆</div>
                <h2 style={{ marginBottom: '30px' }}>Gestión de Fútbol</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="Usuario" style={{ padding: '20px', fontSize: '18px', borderRadius: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, username: e.target.value})} />
                    <input type="password" placeholder="Contraseña" style={{ padding: '20px', fontSize: '18px', borderRadius: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, password: e.target.value})} />
                    <button type="submit" style={{ padding: '18px', background: '#007bff', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '18px' }}>ENTRAR</button>
                </form>
                <div style={{ marginTop: '30px', fontSize: '10px', color: '#bbb' }}>
                    v2.0 - Creado por <b>Daniel Martinez</b>
                </div>
            </div>
        </div>
    );
};
export default Login;