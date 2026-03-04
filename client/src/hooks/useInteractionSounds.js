import { useMemo, useCallback } from 'react';

// URLS de los sonidos de prueba (puedes cambiarlas por archivos locales luego)
const SOUND_URLS = {
  click: 'https://mixkit.imgix.net/sf/mixkit-mechanical-pop-2342.mp3', // Corto y limpio para botones
  swipe: 'https://mixkit.imgix.net/sf/mixkit-fast-sword-whoosh-2357.mp3', // Rápido para sliders
  open: 'https://mixkit.imgix.net/sf/mixkit-opening-software-interface-1052.mp3', // Apertura de modal
};

const useInteractionSounds = () => {
  // ✅ Pre-cargamos los objetos Audio una sola vez (useMemo)
  // Esto asegura latencia cero: el sonido ya está en memoria al pulsar.
  const audioElements = useMemo(() => {
    return {
      click: new Audio(SOUND_URLS.click),
      swipe: new Audio(SOUND_URLS.swipe),
      open: new Audio(SOUND_URLS.open),
    };
  }, []);

  // Función genérica para reproducir
  const playSound = useCallback((soundKey) => {
    const audio = audioElements[soundKey];
    if (audio) {
      // ✅ Reseteamos el tiempo para permitir clics rápidos (rapid-fire)
      audio.currentTime = 0; 
      audio.volume = 0.5; // Volumen por defecto (50%)
      
      // La primera vez que suene, Chrome o Safari pueden bloquearlo.
      // Esta estructura captura el error y espera a la interacción del usuario.
      audio.play().catch(e => {
        // console.log("Sonido bloqueado temporalmente por política del navegador. Esperando interacción.");
      });
    }
  }, [audioElements]);

  // ✅ HELPER METHODS para usar directamente en tus componentes
  const playClick = () => playSound('click');
  const playSwipe = () => playSound('swipe');
  const playOpen = () => playSound('open');

  return { playClick, playSwipe, playOpen };
};

export default useInteractionSounds;