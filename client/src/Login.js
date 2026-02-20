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
        } catch (error) {
            alert("Usuario o contraseña incorrectos");
        }
    };

    return (
        <div style={{ 
            height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', 
            alignItems: 'center', background: '#f0f2f5', padding: '20px', fontFamily: 'Arial' 
        }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ fontSize: '60px', marginBottom: '10px' }}>🏆</div>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Gestión de Fútbol</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input 
                        type="text" placeholder="Usuario" 
                        style={{ padding: '18px', fontSize: '18px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} 
                        onChange={e => setForm({...form, username: e.target.value})} 
                    />
                    <input 
                        type="password" placeholder="Contraseña" 
                        style={{ padding: '18px', fontSize: '18px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }} 
                        onChange={e => setForm({...form, password: e.target.value})} 
                    />
                    <button type="submit" style={{ padding: '18px', fontSize: '18px', background: '#007bff', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                        ENTRAR
                    </button>
                </form>

                <div style={{ marginTop: '30px', fontSize: '12px', color: '#888' }}>
                    Creado por <b>Daniel Martinez</b>
                </div>
            </div>
        </div>
    );
};

export default Login;