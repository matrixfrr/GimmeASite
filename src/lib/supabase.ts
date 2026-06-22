import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

// For backwards compatibility
export const supabase = {
  from: (table: string) => getSupabase().from(table),
};

// Types for our database
export interface ClientQuote {
  id: string;
  email: string;
  name: string;
  plan_type: 'one-time' | 'monthly';
  price_cents: number; // Price in cents (e.g., 149900 = $1499.00)
  notes?: string;
  created_at: string;
  paid: boolean;
  paid_at?: string;
}
