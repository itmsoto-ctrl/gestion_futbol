import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [showInstallBtn, setShowInstallBtn] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                             || window.navigator.standalone;

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!isStandalone) setShowInstallBtn(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Lógica iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS && !isStandalone) setShowInstallBtn(true);

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setShowInstallBtn(false);
            setDeferredPrompt(null);
        } else {
            alert("En iPhone: Pulsa 'Compartir' ↑ y luego 'Añadir a pantalla de inicio' ➕");
        }
    };

    return { showInstallBtn, handleInstallClick };
};