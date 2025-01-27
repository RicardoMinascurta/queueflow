"use client";

import { usePathname } from 'next/navigation';
import { useFullscreen } from "@/hooks/useFullscreen";
import { QueueProvider } from '@/contexts/QueueContext';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isFullscreen } = useFullscreen();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hideSidebar = !isAuthenticated || (isFullscreen && pathname === '/display');

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  return (
    <QueueProvider>
      <div className={`${hideSidebar ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
        <Sidebar />
      </div>
      <main className={`transition-all duration-300 ${!hideSidebar ? 'ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </QueueProvider>
  );
} 