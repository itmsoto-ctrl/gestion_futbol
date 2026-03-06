// client/src/serviceWorkerRegistration.js

export function register() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Apuntamos al archivo que está en la carpeta PUBLIC
        const swUrl = `/serviceWorker.js`; 
  
        navigator.serviceWorker
          .register(swUrl)
          .then((registration) => {
            console.log('✅ Service Worker registrado con éxito:', registration.scope);
            
            // Forzamos la actualización si hay cambios en el worker
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('✨ Nueva versión de VORA7 disponible. Refresca la app.');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error('❌ Error al registrar el Service Worker:', error);
          });
      });
    }
  }
  
  export function unregister() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.unregister();
      });
    }
  }