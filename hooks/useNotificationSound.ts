import { useCallback, useRef, useEffect } from 'react';

export function useNotificationSound() {
  const audioRefs = useRef<HTMLAudioElement[]>([]);

  // Inicializar os elementos de áudio
  useEffect(() => {
    // Criar 20 elementos de áudio para um som mais alto
    audioRefs.current = Array.from({ length: 20 }, () => {
      const audio = new Audio('/sound.mp3');
      audio.volume = 1.0;
      audio.preload = 'auto';
      return audio;
    });

    // Cleanup
    return () => {
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = [];
    };
  }, []);

  const playSound = useCallback(async () => {
    try {
      if (audioRefs.current.length === 0) {
        console.log('Áudio não inicializado');
        return;
      }

      // Parar qualquer reprodução anterior
      audioRefs.current.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });

      // Tocar todos os áudios simultaneamente
      const playPromises = audioRefs.current.map(audio => {
        try {
          return audio.play().catch(() => {});
        } catch {
          return Promise.resolve();
        }
      });

      await Promise.all(playPromises);

    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }, []);

  return playSound;
} 