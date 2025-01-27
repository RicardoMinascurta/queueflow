"use client";

import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useQueue } from '@/contexts/QueueContext';

interface Call {
  number: number;
  counter: number;
  counterName: string;
}

interface FullscreenDisplayProps {
  currentCalls: Call[];
}

export default function FullscreenDisplay({ currentCalls }: FullscreenDisplayProps) {
  const { lastCall } = useQueue();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Função para entrar em modo fullscreen
  const enterFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowControls(false); // Esconde os controles ao entrar em fullscreen
    } catch (error) {
      console.error('Erro ao entrar em tela cheia:', error);
    }
  };

  // Função para sair do modo fullscreen
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
      setShowControls(true); // Mostra os controles ao sair do fullscreen
    } catch (error) {
      console.error('Erro ao sair da tela cheia:', error);
    }
  };

  // Monitora mudanças no estado de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      setShowControls(!isInFullscreen); // Atualiza visibilidade dos controles
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div 
      className="relative min-h-screen bg-gradient-to-br from-blue-50 to-white"
      onMouseEnter={() => isFullscreen && setShowControls(true)}
      onMouseLeave={() => isFullscreen && setShowControls(false)}
    >
      <button
        onClick={isFullscreen ? exitFullscreen : enterFullscreen}
        className={`fixed top-4 right-4 z-50 p-3 bg-white/90 hover:bg-white shadow-lg rounded-full transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {isFullscreen ? (
          <Minimize2 className="w-6 h-6 text-blue-600" />
        ) : (
          <Maximize2 className="w-6 h-6 text-blue-600" />
        )}
      </button>

      <div className={`transition-all duration-300 ${isFullscreen ? 'p-8' : 'p-4'}`}>
        <div className="max-w-7xl mx-auto p-8">
          {/* Última senha chamada */}
          <div className="bg-blue-600 text-white rounded-2xl p-12 mb-8 shadow-lg">
            <h2 className="text-2xl font-medium mb-8">Última Senha</h2>
            <div className="text-center">
              <p className="text-8xl font-bold mb-4">
                {lastCall ? String(lastCall.number).padStart(3, '0') : '000'}
              </p>
              <p className="text-2xl">{lastCall?.counterName || 'Aguardando...'}</p>
            </div>
          </div>

          {/* Chamadas anteriores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentCalls.slice(0, 8).map((call, index) => (
              <div 
                key={`${call.number}-${call.counter}-${index}`}
                className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-8 text-center border border-blue-100"
              >
                <p className="text-5xl font-bold text-gray-800 mb-2">
                  {String(call.number).padStart(3, '0')}
                </p>
                <p className="text-lg text-gray-600">{call.counterName}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 