// client/src/hooks/usePushNotifications.js
import API_BASE_URL from '../apiConfig';

const VAPID_PUBLIC_KEY = "BMWP42qHrmoQLzPXdFl20H7BBVeBgwkqSvG5O9xUHI3rFggyEdOP4E6SZwepIDrR2UUmblEziduHdLJ3zUCal8M";

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Pedimos permiso explícito
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            const token = localStorage.getItem('token');
            await fetch(`${API_BASE_URL}/api/auth/subscribe-push`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
            });

            console.log("🚀 Suscripción Push confirmada en el servidor.");
        } catch (err) {
            console.error("❌ Error en suscripción push:", err);
        }
    };

    return { subscribeUser };
};