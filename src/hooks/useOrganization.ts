"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Organization {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  updated_at: string;
}

export function useOrganization() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useOrganization] Erro ao buscar sessão:', sessionError);
          router.push('/auth/signin');
          return;
        }

        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Primeiro tenta buscar a organização existente
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_email', session.user.email)
          .single();

        // Se não encontrar organização, cria uma nova
        if (orgError?.code === 'PGRST116') { // PGRST116 = nenhuma linha encontrada
          const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert([
              {
                name: session.user.email?.split('@')[0] || 'Minha Organização',
                owner_email: session.user.email
              }
            ])
            .select()
            .single();

          if (createError) {
            console.error('[useOrganization] Erro ao criar organização:', createError);
            return;
          }

          setOrganization(newOrg);
        } else if (orgError) {
          console.error('[useOrganization] Erro ao buscar organização:', orgError);
          return;
        } else {
          setOrganization(orgData);
        }
      } catch (error) {
        console.error('[useOrganization] Erro inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [router]);

  return { organization, loading };
} 