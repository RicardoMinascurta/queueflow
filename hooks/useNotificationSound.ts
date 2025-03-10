"use client";

import { useState, useEffect } from 'react';

export function useNotificationSound() {
  const [audio] = useState<HTMLAudioElement | null>(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sound.mp3');
      audio.volume = 1.0; // Volume máximo
      return audio;
    }
    return null;
  });
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const handleInteraction = () => {
      setCanPlay(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const playSound = async () => {
    if (!audio || !canPlay) return;
    
    try {
      // Toca o som apenas uma vez
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.error('[useNotificationSound] Erro ao tocar áudio:', error);
    }
  };

  return playSound;
} 