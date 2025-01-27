"use client";
import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Card de Estatística
function StatCard({ title, value, icon, description }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          {icon}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface Stats {
  today: number;
  week: number;
  month: number;
}

interface ChartData {
  name: string;
  calls: number;
}

type ViewType = 'day' | 'week' | 'month';

export default function StatsPage() {
  const [stats, setStats] = useState<Stats>({
    today: 0,
    week: 0,
    month: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { organization } = useOrganization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('day');

  useEffect(() => {
    if (organization) {
      loadStats();
      loadChartData();
    }
  }, [organization, currentDate, viewType]);

  const loadStats = async () => {
    try {
      if (!organization) return;
      
      setLoading(true);
      const now = new Date();
      const startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [todayStats, weekStats, monthStats] = await Promise.all([
        supabase
          .from('queue_calls')
          .select('count', { count: 'exact' })
          .eq('organization_id', organization.id)
          .gte('created_at', startOfDay),
        supabase
          .from('queue_calls')
          .select('count', { count: 'exact' })
          .eq('organization_id', organization.id)
          .gte('created_at', startOfWeek),
        supabase
          .from('queue_calls')
          .select('count', { count: 'exact' })
          .eq('organization_id', organization.id)
          .gte('created_at', startOfMonth)
      ]);

      if (todayStats.error) throw todayStats.error;
      if (weekStats.error) throw weekStats.error;
      if (monthStats.error) throw monthStats.error;

      setStats({
        today: todayStats.count || 0,
        week: weekStats.count || 0,
        month: monthStats.count || 0
      });
    } catch (error) {
      console.error('[Stats] Erro ao carregar estatísticas:', error);
      alert('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      if (!organization) return;

      let startDate = new Date(currentDate);
      let endDate = new Date(currentDate);
      
      switch (viewType) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 6);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          break;
      }

      const { data, error } = await supabase
        .from('queue_calls')
        .select('created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Agrupar por período
      const counts: { [key: string]: number } = {};
      let intervals = 0;

      switch (viewType) {
        case 'day':
          intervals = 24;
          for (let i = 0; i < intervals; i++) {
            const hour = new Date(startDate);
            hour.setHours(i, 0, 0, 0);
            counts[hour.toISOString()] = 0;
          }
          data?.forEach(call => {
            const hour = new Date(call.created_at);
            hour.setMinutes(0, 0, 0);
            counts[hour.toISOString()] = (counts[hour.toISOString()] || 0) + 1;
          });
          break;

        case 'week':
          intervals = 7;
          for (let i = 0; i < intervals; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            counts[date.toISOString().split('T')[0]] = 0;
          }
          data?.forEach(call => {
            const date = new Date(call.created_at).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
          });
          break;

        case 'month':
          intervals = endDate.getDate();
          for (let i = 1; i <= intervals; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            counts[date.toISOString().split('T')[0]] = 0;
          }
          data?.forEach(call => {
            const date = new Date(call.created_at).toISOString().split('T')[0];
            counts[date] = (counts[date] || 0) + 1;
          });
          break;
      }

      const formattedData = Object.entries(counts).map(([date, count]) => {
        let name = '';
        const dateObj = new Date(date);

        switch (viewType) {
          case 'day':
            name = dateObj.getHours().toString().padStart(2, '0');
            break;
          case 'week':
            name = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
            name = name.charAt(0).toUpperCase() + name.slice(1);
            break;
          case 'month':
            name = dateObj.getDate().toString().padStart(2, '0');
            break;
        }

        return {
          name,
          calls: count
        };
      });

      setChartData(formattedData);
    } catch (error) {
      console.error('[Stats] Erro ao carregar dados do gráfico:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
        break;
    }
    setCurrentDate(newDate);
  };

  const getDateLabel = () => {
    switch (viewType) {
      case 'day':
        return currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - 6);
        return `${weekStart.toLocaleDateString('pt-BR', { day: 'numeric' })} - ${currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-blue-900">Estatísticas</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Chamadas Hoje"
          value={stats.today}
          icon={<Clock size={24} />}
          description="Total de senhas chamadas hoje"
        />
        <StatCard
          title="Chamadas esta Semana"
          value={stats.week}
          icon={<Calendar size={24} />}
          description="Total de senhas nos últimos 7 dias"
        />
        <StatCard
          title="Chamadas este Mês"
          value={stats.month}
          icon={<Users size={24} />}
          description="Total de senhas neste mês"
        />
      </div>

      {/* Gráfico */}
      <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-blue-900">Chamadas por {viewType === 'day' ? 'Hora' : viewType === 'week' ? 'Dia' : 'Mês'}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 rounded-lg ${viewType === 'day' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Dia
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 rounded-lg ${viewType === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 rounded-lg ${viewType === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Mês
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm text-gray-600">
              {getDateLabel()}
            </span>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 