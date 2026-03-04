import { useMemo, useCallback } from 'react';

const SOUND_URLS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_730248383f.mp3', // Click seco
  swipe: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c363943340.mp3', // Swoosh rápido
  open: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8233345842.mp3', // Apertura
  score: 'https://cdn.pixabay.com/audio/2022/03/24/audio_1e3706c478.mp3' // Redoble/Puntos
};

const useInteractionSounds = () => {
  const audioElements = useMemo(() => ({
      click: new Audio(SOUND_URLS.click),
      swipe: new Audio(SOUND_URLS.swipe),
      open: new Audio(SOUND_URLS.open),
      score: new Audio(SOUND_URLS.score),
  }), []);

  const playSound = useCallback((key, volume = 0.5) => {
    const audio = audioElements[key];
    if (audio) {
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    }
  }, [audioElements]);

  return { 
    playClick: () => playSound('click'), 
    playSwipe: () => playSound('swipe'), 
    playOpen: () => playSound('open'),
    playScore: (v) => playSound('score', v)
  };
};

export default useInteractionSounds;