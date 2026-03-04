import { useMemo, useCallback } from 'react';

const SOUND_URLS = {
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_730248383f.mp3', 
  swipe: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c363943340.mp3', 
  open: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8233345842.mp3',
  score: 'https://cdn.pixabay.com/audio/2024/02/12/audio_f5f6b2e1b1.mp3' // Redoble electrónico
};

const useInteractionSounds = () => {
  const audioElements = useMemo(() => ({
      click: new Audio(SOUND_URLS.click),
      swipe: new Audio(SOUND_URLS.swipe),
      open: new Audio(SOUND_URLS.open),
      score: new Audio(SOUND_URLS.score),
  }), []);

  const playSound = useCallback((key, volume = 0.4) => {
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