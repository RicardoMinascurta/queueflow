"use client";
import { useState, useEffect } from 'react';
import { Settings, Mail, Hash, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CounterConfig from '@/components/CounterConfig';
import { useOrganization } from '@/hooks/useOrganization';

interface Counter {
  id?: number;
  name: string;
}

interface OrganizationSettings {
  max_count: number;
}

export default function SettingsPage() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [maxCount, setMaxCount] = useState<number>(99);
  const { organization, loading: orgLoading } = useOrganization();

  useEffect(() => {
    if (organization) {
      loadCounters();
    }
    loadUserEmail();
    loadSettings();
  }, [organization]);

  const loadUserEmail = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    } catch (error) {
      console.error('[Settings] Erro ao carregar email:', error);
    }
  };

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
    } catch (error) {
      console.error('[Settings] Erro ao carregar gabinetes:', error);
      alert('Erro ao carregar gabinetes');
    }
  };

  const loadSettings = async () => {
    try {
      if (!organization) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('max_count')
        .eq('id', organization.id)
        .single();

      if (error) throw error;

      if (data) {
        setMaxCount(data.max_count || 99);
      }
    } catch (error) {
      console.error('[Settings] Erro ao carregar configurações:', error);
    }
  };

  const saveSettings = async () => {
    try {
      if (!organization) return;

      const { error } = await supabase
        .from('organizations')
        .update({ max_count: maxCount })
        .eq('id', organization.id);

      if (error) throw error;

      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('[Settings] Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const handleSave = async (updatedCounters: Counter[]) => {
    await loadCounters();
  };

  if (orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-blue-900">Configurações</h1>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Card da Conta */}
        <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Conta</h2>
              <p className="text-sm text-gray-500">Email de login</p>
            </div>
          </div>
          <p className="text-gray-600">{userEmail}</p>
        </div>

        {/* Card da Contagem Máxima */}
        <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Hash size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Contagem Máxima</h2>
              <p className="text-sm text-gray-500">Número máximo de senhas</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={maxCount}
              onChange={(e) => setMaxCount(Number(e.target.value))}
              className="block w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={99}>99</option>
              <option value={999}>999</option>
              <option value={9999}>9999</option>
            </select>
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>

        {/* Card dos Gabinetes */}
        <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Gabinetes</h2>
              <p className="text-sm text-gray-500">Gerenciar gabinetes de atendimento</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowConfig(true)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600">
                  {counters.length === 0 ? 'Nenhum gabinete configurado' : `${counters.length} gabinete${counters.length === 1 ? '' : 's'}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-600 hover:text-blue-700">Gerenciar</span>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {counters.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {counters.slice(0, 3).map(counter => (
                  <div
                    key={counter.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 cursor-default group"
                  >
                    <span className="text-gray-600 group-hover:text-blue-600">{counter.name}</span>
                  </div>
                ))}
                {counters.length > 3 && (
                  <div className="flex items-center justify-center p-2">
                    <span className="text-sm text-gray-500">
                      + {counters.length - 3} {counters.length - 3 === 1 ? 'gabinete' : 'gabinetes'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showConfig && (
        <CounterConfig
          initialCounters={counters}
          onSave={handleSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
} 