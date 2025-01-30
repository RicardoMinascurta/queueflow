"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/contexts/QueueContext';
import { Volume2, VolumeX, Maximize2, Minimize2, LogOut } from 'lucide-react';
import ViewToggle from '@/components/ViewToggle';
import { supabase } from '@/lib/supabase';
import { useFullscreen } from '@/hooks/useFullscreen';
import { LastCall } from '@/contexts/QueueContext';
import { useNotificationSound } from '@/hooks/useNotificationSound';

export default function Display() {
  const router = useRouter();
  const { lastCall } = useQueue();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [playSound, setPlaySound] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const lastCallRef = useRef<LastCall | null>(null);
  const playNotificationSound = useNotificationSound();

  // Tocar som quando lastCall mudar
  useEffect(() => {
    if (!lastCall || !playSound || !hasInteracted || lastCallRef.current?.id === lastCall.id) {
      return;
    }

    lastCallRef.current = lastCall;
    playNotificationSound();
  }, [lastCall, playSound, hasInteracted, playNotificationSound]);

  // Marcar como interagido quando entrar em fullscreen
  useEffect(() => {
    if (isFullscreen && !hasInteracted) {
      setHasInteracted(true);
    }
  }, [isFullscreen, hasInteracted]);

  // Adicionar listener para ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isFullscreen, toggleFullscreen]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/signin');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleFullscreen = () => {
    toggleFullscreen();
    setHasInteracted(true); // Marcar como interagido ao clicar no botão de fullscreen
  };

  return (
    <div className={`${
      isFullscreen 
        ? 'fixed inset-0 w-screen h-screen overflow-hidden' 
        : 'min-h-screen'
    } bg-[#F6FAFF] flex flex-col`}>
      {/* Toggle no topo - só aparece quando não estiver em fullscreen */}
      {!isFullscreen && (
        <div className="pt-8">
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 rounded-md text-gray-700 hover:bg-blue-50"
              >
                Painel de Controle
              </button>
              <button
                onClick={() => router.push('/display')}
                className="px-6 py-2 rounded-md bg-blue-600 text-white"
              >
                Monitor de Senhas
              </button>
            </div>
          </div>

          {/* Botões no canto superior direito */}
          <div className="fixed top-4 right-4 flex gap-2">
            {/* Botão de Som */}
            <button
              onClick={() => setPlaySound(!playSound)}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              title={playSound ? "Desativar som" : "Ativar som"}
            >
              {playSound ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>

            {/* Botão Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
              title="Tela cheia (ESC para sair)"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="h-screen flex flex-col">
        {/* Container do Número e Guichê com margens proporcionais */}
        <div className="flex-1 flex flex-col justify-center items-center">
          {/* Senha */}
          <div className="text-center mb-[5vh]">
            <h2 className={`font-bold tracking-wider text-black/90 ${
              isFullscreen ? 'text-[15vw]' : 'text-[10vw]'
            } leading-tight`}>
              SENHA: {lastCall ? String(lastCall.number).padStart(2, '0') : '00'}
            </h2>
          </div>
          
          {/* Guichê */}
          <div className="text-center">
            <h3 className={`font-bold text-black/90 ${
              isFullscreen ? 'text-[10vw]' : 'text-[7vw]'
            } leading-tight`}>
              {lastCall ? lastCall.counter_name : 'Gabinete X'}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}