import React, { useState } from 'react';
import { Mail, User, Lock, Loader2, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../apiConfig';

const PlayerRegistration = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: Registro, 3: Éxito
    const [loading, setLoading] = useState(false);
    
    const [email, setEmail] = useState('');
    const [name, setName] = useState(''); // Ajustado a 'name'
    const [password, setPassword] = useState('');

    const handleCheckEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.exists) {
                alert("¡Ya estás en VORA! Identifícate para continuar.");
                // Aquí definiremos luego el paso de Login
            } else {
                setStep(2);
            }
        } catch (err) {
            alert("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register-basic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password }) // Enviamos 'name'
            });

            if (res.ok) {
                setStep(3);
            } else {
                const error = await res.json();
                alert(error.message || "Error al crear la cuenta");
            }
        } catch (err) {
            alert("Fallo en el registro");
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) return (
        <div className="min-h-screen bg-[#665C5A] flex flex-col items-center justify-center p-6 text-center text-white">
            <CheckCircle size={80} className="text-lime-400 mb-6" />
            <h1 className="text-3xl font-black uppercase italic italic">¡REGISTRO OK!</h1>
            <p className="mt-2 opacity-70">Email: {email}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#665C5A] text-white p-6 flex flex-col items-center font-sans">
            <div className="mt-10 mb-10">
                <img src="/logo-shine.webp" alt="VORA" className="w-40" />
            </div>

            <div className="w-full max-w-sm">
                {step === 1 && (
                    <form onSubmit={handleCheckEmail} className="space-y-6">
                        <input required type="email" placeholder="TU EMAIL" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-lime-400 text-black font-black py-5 rounded-[2.5rem] uppercase italic">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONTINUAR"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <input required placeholder="NOMBRE Y APELLIDOS" value={name} onChange={(e) => setName(e.target.value.toUpperCase())}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <input required type="password" placeholder="CONTRASEÑA" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-[2rem] outline-none font-bold" />
                        <button type="submit" className="w-full bg-white text-black font-black py-5 rounded-[2.5rem] uppercase italic mt-4">
                            {loading ? <Loader2 className="animate-spin mx-auto" /> : "REGISTRARME"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PlayerRegistration;