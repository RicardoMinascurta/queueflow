import { supabase } from './supabase';
import { Database } from './database.types';

type Counter = Database['public']['Tables']['counters']['Row'];
type Call = Database['public']['Tables']['calls']['Row'];

export async function getCounters(): Promise<Counter[]> {
  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveCounter(counter: Omit<Counter, 'id' | 'created_at' | 'updated_at'>): Promise<Counter> {
  const { data, error } = await supabase
    .from('counters')
    .insert([counter])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCounter(id: number, counter: Partial<Counter>): Promise<Counter> {
  const { data, error } = await supabase
    .from('counters')
    .update(counter)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCounter(id: number): Promise<void> {
  const { error } = await supabase
    .from('counters')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function broadcastCall(call: { number: number; counter: number }) {
  const { error } = await supabase
    .from('calls')
    .insert([
      {
        number: call.number,
        counter_id: call.counter,
        status: 'active'
      }
    ]);

  if (error) throw error;
}

export async function saveCalls(call: Omit<Call, 'id' | 'created_at'>): Promise<Call> {
  const { data, error } = await supabase
    .from('calls')
    .insert([call])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLastCalls(limit: number = 10): Promise<Call[]> {
  const { data, error } = await supabase
    .from('calls')
    .select('*, counters(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
} 