"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueue } from '@/contexts/QueueContext';
import { useOrganization } from '@/hooks/useOrganization';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Counter {
  id: number;
  name: string;
  organization_id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [specificNumber, setSpecificNumber] = useState<string>('');
  const [counters, setCounters] = useState<Counter[]>([]);
  const { lastCall, currentCounter, callNext, callSpecificNumber, setCurrentCounter } = useQueue();
  const { organization } = useOrganization();

  useEffect(() => {
    if (organization) {
      loadCounters();
    }
  }, [organization]);

  // Quando o componente montar, verificar se há um currentCounter no QueueContext
  useEffect(() => {
    if (currentCounter) {
      setSelectedCounter(currentCounter);
    }
  }, [currentCounter]);

  const loadCounters = async () => {
    try {
      if (!organization) return;

      const { data, error } = await supabase
        .from('counters')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('active', true)
        .order('id');

      if (error) throw error;
      setCounters(data || []);

      // Se tiver dados e não tiver counter selecionado, seleciona o primeiro
      if (data && data.length > 0 && !currentCounter) {
        setSelectedCounter(data[0]);
        setCurrentCounter(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar gabinetes:', error);
      alert('Erro ao carregar gabinetes');
    }
  };

  const handleSelectCounter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const counter = counters.find(c => c.id === Number(e.target.value));
    setSelectedCounter(counter || null);
    setCurrentCounter(counter || null);
  };

  const handleCallSpecific = async () => {
    if (!selectedCounter || !specificNumber) {
      alert('Selecione um guichê e digite um número');
      return;
    }

    const number = parseInt(specificNumber);

    // Validar o número antes de chamar
    if (number <= 0) {
      alert('O número deve ser maior que zero');
      return;
    }

    try {
      await callSpecificNumber(number);
      setSpecificNumber('');
    } catch (error: any) {
      if (error.message.includes('número máximo permitido')) {
        alert('Não é possível chamar este número. Configure um limite maior nas configurações.');
      } else {
        alert(error.message || 'Erro ao chamar senha específica');
      }
    }
  };

  const handleCallNext = async () => {
    if (!selectedCounter) {
      alert('Selecione um guichê');
      return;
    }

    try {
      await callNext();
    } catch (error: any) {
      if (error.message.includes('número máximo permitido')) {
        alert('Limite máximo atingido. Configure um limite maior nas configurações.');
      } else {
        alert(error.message || 'Erro ao chamar próxima senha');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FAFF]">
      <div className="p-8">
        {/* Toggle no topo */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 rounded-md bg-blue-600 text-white"
            >
              Painel de Controle
            </button>
            <button
              onClick={() => router.push('/display')}
              className="px-6 py-2 rounded-md text-gray-700 hover:bg-blue-50"
            >
              Monitor de Senhas
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-blue-800">Dashboard</h1>
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Card Chamar Gabinete */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-blue-100">
              <h2 className="text-xl font-semibold text-black/90 mb-4">Chamar Gabinete</h2>
              <select
                value={selectedCounter?.id || ''}
                onChange={handleSelectCounter}
                className="w-full bg-white text-gray-900 rounded-lg py-4 px-4 border border-blue-200 mb-4 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar gabinete...</option>
                {counters.map(counter => (
                  <option key={counter.id} value={counter.id}>
                    {counter.name}
                  </option>
                ))}
              </select>

              <div className="space-y-3">
                <button
                  onClick={handleCallNext}
                  disabled={!selectedCounter}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Chamar Próximo
                </button>
              </div>
            </div>

            {/* Card Número Atual */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-blue-100">
              <h2 className="text-xl font-semibold text-black/90 mb-4">Número Atual</h2>
              <div className="text-center py-4">
                <p className="text-7xl font-bold text-black/90 mb-3">
                  {lastCall ? String(lastCall.number).padStart(3, '0') : '---'}
                </p>
                <p className="text-xl text-gray-600">
                  {lastCall ? lastCall.counter_name : 'Aguardando...'}
                </p>
              </div>
            </div>
          </div>

          {/* Chamada Específica */}
          <div className="bg-white shadow-lg rounded-xl p-6 border border-blue-100 mb-6">
            <h2 className="text-xl font-semibold text-black/90 mb-4">Chamar Senha Específica</h2>
            <div className="flex gap-3">
              <input
                type="number"
                value={specificNumber}
                onChange={(e) => setSpecificNumber(e.target.value)}
                placeholder="Digite o número da senha"
                className="flex-1 py-4 px-4 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCallSpecific}
                disabled={!selectedCounter || !specificNumber}
                className="px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Chamar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

