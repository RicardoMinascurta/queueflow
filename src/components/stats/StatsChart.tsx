"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChartDataPoint {
  name: string;
  calls: number;
}

export default function StatsChart() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [timeRange, currentMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = new Date(currentMonth);
      const endDate = new Date(currentMonth);

      if (timeRange === 'day') {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(startDate.getDate() + 6);
      } else {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
      }

      console.log('[StatsChart] Buscando dados:', {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const { data: calls, error } = await supabase
        .from('queue_calls')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (error) {
        console.error('[StatsChart] Erro ao buscar dados:', error);
        throw new Error('Falha ao carregar dados do banco');
      }

      console.log('[StatsChart] Dados recebidos:', calls?.length || 0, 'chamadas');

      let chartData: ChartDataPoint[] = [];

      if (timeRange === 'day') {
        // Dados por hora
        chartData = Array.from({ length: 24 }, (_, hour) => {
          const count = calls?.filter(call => 
            new Date(call.created_at).getHours() === hour
          ).length || 0;

          return {
            name: `${String(hour).padStart(2, '0')}:00`,
            calls: count
          };
        });
      } else if (timeRange === 'week') {
        // Dados por dia da semana
        const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        chartData = weekDays.map((day, index) => ({
          name: day,
          calls: calls?.filter(call => 
            new Date(call.created_at).getDay() === index
          ).length || 0
        }));
      } else {
        // Dados por dia do mês
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        chartData = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return {
            name: String(day),
            calls: calls?.filter(call => 
              new Date(call.created_at).getDate() === day
            ).length || 0
          };
        });
      }

      console.log('[StatsChart] Dados processados:', chartData);
      setData(chartData);
    } catch (error) {
      console.error('[StatsChart] Erro ao processar dados:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm shadow-lg rounded-xl p-6 border border-blue-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-3 py-1 rounded-md transition-colors ${
              timeRange === 'day' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-md transition-colors ${
              timeRange === 'week' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-md transition-colors ${
              timeRange === 'month' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mês
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-gray-800 font-medium">
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 hover:text-gray-900"
            disabled={loading}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="h-80">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name"
                stroke="#6b7280"
                fontSize={12}
                angle={timeRange === 'month' ? -45 : 0}
                height={60}
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                formatter={(value: number) => [`${value} chamadas`, 'Total']}
              />
              <Line 
                type="monotone" 
                dataKey="calls" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={timeRange !== 'month'}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
} 