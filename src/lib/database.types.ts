export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      counters: {
        Row: {
          id: number
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
      }
      queue_calls: {
        Row: {
          id: number
          number: number
          counter: number
          counterName: string
          type: string
          created_at: string
        }
        Insert: {
          number: number
          counter: number
          counterName: string
          type: string
          created_at?: string
        }
        Update: {
          number?: number
          counter?: number
          counterName?: string
          type?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 