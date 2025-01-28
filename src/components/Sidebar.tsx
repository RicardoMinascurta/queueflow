"use client";
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, BarChart2, Settings, LogOut } from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { isFullscreen } = useFullscreen();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  // Não renderiza a sidebar se não estiver autenticado ou estiver em fullscreen na rota /display
  if (!isAuthenticated || (isFullscreen && pathname === '/display')) {
    return null;
  }

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />
    },
    {
      path: '/stats',
      label: 'Estatísticas',
      icon: <BarChart2 size={20} />
    },
    {
      path: '/settings',
      label: 'Definições',
      icon: <Settings size={20} />
    }
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-sm border-r border-blue-200 flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-8">QueueFlow</h1>
        
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-blue-50'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-blue-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
} 