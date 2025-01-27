"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';

export interface LastCall {
  id: number;
  number: number;
  counter_id: number;
  counter_name: string;
  organization_id: string;
  created_at: string;
}

interface Counter {
  id: number;
  name: string;
  organization_id: string;
}

interface QueueContextData {
  lastCall: LastCall | null;
  currentCounter: Counter | null;
  setCurrentCounter: (counter: Counter | null) => void;
  callNext: () => Promise<void>;
  callSpecificNumber: (number: number) => Promise<void>;
}

const QueueContext = createContext<QueueContextData>({
  lastCall: null,
  currentCounter: null,
  setCurrentCounter: () => {},
  callNext: async () => {},
  callSpecificNumber: async () => {},
});

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [lastCall, setLastCall] = useState<LastCall | null>(null);
  const [currentCounter, setCurrentCounter] = useState<Counter | null>(null);
  const { organization } = useOrganization();
  const lastCallRef = useRef<LastCall | null>(null);

  // Carregar estado inicial e configurar realtime
  useEffect(() => {
    if (!organization?.id) return;

    console.log('[QueueContext] Iniciando com organização:', organization.id);
    let pollInterval: NodeJS.Timeout;

    // Carregar estado inicial
    const loadInitialState = async () => {
      try {
        const { data, error } = await supabase
          .from('queue_calls')
          .select('*')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('[QueueContext] Erro ao carregar estado inicial:', error);
          return;
        }

        if (data) {
          console.log('[QueueContext] Estado inicial carregado:', data);
          setLastCall(data as LastCall);
          lastCallRef.current = data as LastCall;
        }
      } catch (error) {
        console.error('[QueueContext] Erro ao carregar estado inicial:', error);
      }
    };

    // Configurar polling como backup
    const startPolling = () => {
      pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('queue_calls')
            .select('*')
            .eq('organization_id', organization.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('[QueueContext] Erro no polling:', error);
            return;
          }

          if (data && (!lastCallRef.current || data.id !== lastCallRef.current.id)) {
            console.log('[QueueContext] Nova chamada detectada via polling:', data);
            setLastCall(data as LastCall);
            lastCallRef.current = data as LastCall;
          }
        } catch (error) {
          console.error('[QueueContext] Erro no polling:', error);
        }
      }, 2000); // Polling a cada 2 segundos
    };

    // Configurar realtime
    const channel = supabase.channel(`queue-changes-${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos
          schema: 'public',
          table: 'queue_calls',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('[QueueContext] Mudança detectada:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newCall = payload.new as LastCall;
            if (!lastCallRef.current || newCall.id !== lastCallRef.current.id) {
              console.log('[QueueContext] Atualizando lastCall:', newCall);
              setLastCall(newCall);
              lastCallRef.current = newCall;
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[QueueContext] Status da subscription:', status);
      });

    // Iniciar
    loadInitialState();
    startPolling();

    return () => {
      console.log('[QueueContext] Limpando recursos...');
      clearInterval(pollInterval);
      channel.unsubscribe();
    };
  }, [organization?.id]);

  const callNext = async () => {
    try {
      if (!organization || !currentCounter) {
        throw new Error('Selecione um gabinete primeiro');
      }

      // Buscar última chamada e max_count
      const [lastCallResponse, orgResponse] = await Promise.all([
        supabase
          .from('queue_calls')
          .select('number')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('organizations')
          .select('max_count')
          .eq('id', organization.id)
          .single()
      ]);

      if (orgResponse.error) throw orgResponse.error;
      const maxCount = orgResponse.data?.max_count || 99;

      // Calcular próximo número
      let nextNumber = lastCallResponse.data ? lastCallResponse.data.number + 1 : 1;
      
      // Se passar do máximo, volta para 1
      if (nextNumber > maxCount) {
        nextNumber = 1;
      }

      // Criar nova chamada
      const { data: newCall, error: insertError } = await supabase
        .from('queue_calls')
        .insert([
          {
            number: nextNumber,
            counter_id: currentCounter.id,
            counter_name: currentCounter.name,
            organization_id: organization.id,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (newCall) {
        console.log('[QueueContext] Nova chamada criada:', newCall);
        setLastCall(newCall as LastCall);
        lastCallRef.current = newCall as LastCall;
      }

    } catch (error: any) {
      console.error('[QueueContext] Erro ao chamar próxima senha:', error);
      alert(error.message || 'Erro ao chamar próxima senha');
    }
  };

  const callSpecificNumber = async (number: number) => {
    try {
      if (!organization || !currentCounter) {
        throw new Error('Selecione um gabinete primeiro');
      }

      if (!number || number <= 0) {
        throw new Error('Número inválido');
      }

      // Verificar max_count
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('max_count')
        .eq('id', organization.id)
        .single();

      if (orgError) throw orgError;
      const maxCount = org?.max_count || 99;

      if (number > maxCount) {
        throw new Error(`O número não pode ser maior que ${maxCount}`);
      }

      // Criar chamada específica
      const { data: newCall, error: insertError } = await supabase
        .from('queue_calls')
        .insert([
          {
            number,
            counter_id: currentCounter.id,
            counter_name: currentCounter.name,
            organization_id: organization.id,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (newCall) {
        console.log('[QueueContext] Nova chamada específica criada:', newCall);
        setLastCall(newCall as LastCall);
        lastCallRef.current = newCall as LastCall;
      }

    } catch (error: any) {
      console.error('[QueueContext] Erro ao chamar senha específica:', error);
      alert(error.message || 'Erro ao chamar senha específica');
    }
  };

  return (
    <QueueContext.Provider value={{
      lastCall,
      currentCounter,
      setCurrentCounter,
      callNext,
      callSpecificNumber,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}; 