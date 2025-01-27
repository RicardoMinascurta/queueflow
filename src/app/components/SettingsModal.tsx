"use client";

import { useState, useEffect } from 'react';
import { X, Plus, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Counter {
  id: number;
  name: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  counters: Counter[];
  onSave: (counters: Counter[]) => void;
}

export default function SettingsModal({ isOpen, onClose, counters, onSave }: SettingsModalProps) {
  const [localCounters, setLocalCounters] = useState<Counter[]>(counters);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalCounters(counters);
  }, [counters]);

  const addCounter = () => {
    const nextId = Math.max(0, ...localCounters.map(c => c.id)) + 1;
    setLocalCounters([...localCounters, { id: nextId, name: `Guichê ${String(nextId).padStart(2, '0')}` }]);
  };

  const removeCounter = (id: number) => {
    setLocalCounters(localCounters.filter(counter => counter.id !== id));
  };

  const updateCounterName = (id: number, name: string) => {
    setLocalCounters(localCounters.map(counter => 
      counter.id === id ? { ...counter, name } : counter
    ));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Iniciando salvamento dos counters:', localCounters);
      
      // Primeiro, buscar os counters existentes para debug
      const { data: existingCounters } = await supabase
        .from('counters')
        .select('*');
      console.log('Counters existentes:', existingCounters);

      // Deletar todos os counters existentes
      const { error: deleteError } = await supabase
        .from('counters')
        .delete()
        .gte('id', 0);
        
      if (deleteError) {
        console.error('Erro ao deletar counters:', deleteError);
        return;
      }
      console.log('Counters deletados com sucesso');

      // Inserir os novos counters
      const { data: insertedCounters, error: insertError } = await supabase
        .from('counters')
        .insert(localCounters)
        .select();

      if (insertError) {
        console.error('Erro ao inserir counters:', insertError);
        return;
      }
      console.log('Novos counters inseridos:', insertedCounters);

      // Verificar se a inserção foi bem sucedida
      const { data: finalCounters } = await supabase
        .from('counters')
        .select('*')
        .order('id');
      console.log('Estado final dos counters:', finalCounters);

      onSave(finalCounters || localCounters);
      onClose();
    } catch (e) {
      console.error('Erro inesperado ao salvar:', e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-blue-900">Configurações</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSaving}
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {localCounters.map((counter) => (
            <div key={counter.id} className="flex gap-2">
              <input
                type="text"
                value={counter.name}
                onChange={(e) => updateCounterName(counter.id, e.target.value)}
                className="flex-1 p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSaving}
              />
              <button
                onClick={() => removeCounter(counter.id)}
                className="p-2 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                disabled={isSaving || localCounters.length <= 1}
              >
                <Trash size={20} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={addCounter}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
            disabled={isSaving}
          >
            <Plus size={20} />
            Adicionar Guichê
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || localCounters.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 