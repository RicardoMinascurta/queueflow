"use client";

import { useRouter } from 'next/navigation';
import { Monitor, LayoutDashboard } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';

export default function ViewToggle({ currentView }: { currentView: 'dashboard' | 'display' }) {
  const router = useRouter();
  const { isFullscreen } = useFullscreen();

  const toggleView = (view: 'dashboard' | 'display') => {
    router.push(`/${view}`);
  };

  return (
    <div className={`flex justify-center items-center gap-4 mb-8 transition-opacity duration-300 ${isFullscreen ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
      <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-sm">
        <button
          onClick={() => toggleView('dashboard')}
          className={`${
            currentView === 'dashboard'
              ? 'bg-custom-blue text-white'
              : 'text-gray-600 hover:text-gray-800'
          } px-4 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center gap-2`}
        >
          <LayoutDashboard size={20} />
          Painel de Controle
        </button>
        <button
          onClick={() => toggleView('display')}
          className={`${
            currentView === 'display'
              ? 'bg-custom-blue text-white'
              : 'text-gray-600 hover:text-gray-800'
          } px-4 py-2 rounded-md transition-all duration-200 ease-in-out flex items-center gap-2`}
        >
          <Monitor size={20} />
          Monitor de Senhas
        </button>
      </div>
    </div>
  );
} 