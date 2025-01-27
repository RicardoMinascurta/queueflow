"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

interface Counter {
  id?: number;
  name: string;
  organization_id?: string;
  active?: boolean;
}

interface CounterConfigProps {
  initialCounters: Counter[];
  onSave: (counters: Counter[]) => void;
  onClose: () => void;
}

export default function CounterConfig({ initialCounters = [], onSave, onClose }: CounterConfigProps) {
  const [counters, setCounters] = useState<Counter[]>(initialCounters);
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddCounter = () => {
    const newCounter: Counter = {
      name: `Gabinete ${counters.length + 1}`,
      organization_id: organization?.id,
      active: true
    };
    setCounters([...counters, newCounter]);
  };

  const handleRemoveCounter = async (counterId: number) => {
    try {
      if (!organization) {
        throw new Error('Organização não encontrada');
      }

      // Se o gabinete já existe no banco
      if (counterId) {
        const { error: updateError } = await supabase
          .from('counters')
          .update({ active: false })
          .eq('id', counterId)
          .eq('organization_id', organization.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Remover da lista local
      setCounters(counters.filter(counter => counter.id !== counterId));
      
    } catch (error: any) {
      console.error('[CounterConfig] Erro ao remover gabinete:', error);
      alert(`Erro ao remover gabinete: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleUpdateCounter = (id: number | undefined, name: string) => {
    setCounters(counters.map(counter => 
      counter.id === id ? { ...counter, name } : counter
    ));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (!organization) {
        throw new Error('Organização não encontrada');
      }

      // Inserir novos gabinetes
      for (const counter of counters.filter(c => !c.id)) {
        const { error: insertError } = await supabase
          .from('counters')
          .insert([{
            name: counter.name,
            organization_id: organization.id,
            active: true,
            created_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('[CounterConfig] Erro ao inserir gabinete:', insertError);
          throw insertError;
        }
      }

      // Atualizar gabinetes existentes
      for (const counter of counters.filter(c => c.id)) {
        const { error: updateError } = await supabase
          .from('counters')
          .update({ 
            name: counter.name,
            active: true 
          })
          .eq('id', counter.id)
          .eq('organization_id', organization.id);

        if (updateError) {
          console.error('[CounterConfig] Erro ao atualizar gabinete:', updateError);
          throw updateError;
        }
      }

      // Buscar gabinetes atualizados
      const { data: updatedCounters, error: fetchError } = await supabase
        .from('counters')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('active', true);

      if (fetchError) {
        console.error('[CounterConfig] Erro ao buscar gabinetes atualizados:', fetchError);
        throw fetchError;
      }

      console.log('[CounterConfig] Gabinetes salvos com sucesso:', updatedCounters);
      await onSave(updatedCounters || []);
      onClose();
    } catch (error: any) {
      console.error('[CounterConfig] Erro ao salvar gabinetes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      alert(`Erro ao salvar gabinetes: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Gerenciar Gabinetes</h2>
        
        <div className="space-y-3 mb-6">
          {counters.map((counter) => (
            <div key={counter.id || counter.name} className="flex items-center gap-2">
              <input
                type="text"
                value={counter.name}
                onChange={(e) => handleUpdateCounter(counter.id, e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do gabinete"
              />
              <button
                onClick={() => counter.id ? handleRemoveCounter(counter.id) : setCounters(c => c.filter(ct => ct !== counter))}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash size={20} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddCounter}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-6"
        >
          <Plus size={20} />
          Adicionar Gabinete
        </button>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
} 