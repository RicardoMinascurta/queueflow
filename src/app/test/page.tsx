"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestPage() {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastCall, setLastCall] = useState<{number: number, counterName: string} | null>(null);

  // Carregar último número ao iniciar
  useEffect(() => {
    const loadLastNumber = async () => {
      const { data } = await supabase
        .from('test_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        console.log('[Test] Último número carregado:', data);
        setCurrentNumber(data.number);
        setLastCall({
          number: data.number,
          counterName: data.counter_name
        });
      }
    };

    loadLastNumber();
  }, []);

  // Configurar Realtime subscription
  useEffect(() => {
    const channel = supabase.channel('test-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'test_calls'
        },
        (payload: any) => {
          console.log('[Test] Mudança detectada:', payload);
          const newCall = payload.new;
          
          // Atualizar estado imediatamente
          setCurrentNumber(newCall.number);
          setLastCall({
            number: newCall.number,
            counterName: newCall.counter_name
          });
        }
      )
      .subscribe((status) => {
        console.log('[Test] Status da subscription:', status);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const callNext = async () => {
    try {
      const nextNumber = currentNumber + 1;
      console.log('[Test] Chamando próximo número:', nextNumber);

      const { data, error } = await supabase
        .from('test_calls')
        .insert({
          number: nextNumber,
          counter_name: 'Guichê Teste'
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local imediatamente
      setCurrentNumber(nextNumber);
      setLastCall({
        number: nextNumber,
        counterName: 'Guichê Teste'
      });

      console.log('[Test] Chamada realizada com sucesso:', data);
    } catch (error) {
      console.error('[Test] Erro ao processar chamada:', error);
      alert('Erro ao processar chamada');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-8">Página de Teste - Realtime</h1>
        
        {/* Painel de Controle */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Painel de Controle</h2>
          <button
            onClick={callNext}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Chamar Próximo
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <h2 className="text-lg font-semibold mb-4">Display</h2>
          <div className="text-6xl font-bold text-blue-600 mb-2">
            {String(currentNumber).padStart(3, '0')}
          </div>
          {lastCall && (
            <div className="text-gray-600">
              {lastCall.counterName}
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-sm font-mono mb-2">Debug Info</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ currentNumber, lastCall }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
} 