import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection (Client-side Vite variables)
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Checks if valid Supabase configuration is present in environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return (
    typeof rawSupabaseUrl === 'string' &&
    rawSupabaseUrl.trim().length > 0 &&
    !rawSupabaseUrl.includes('your-project') &&
    typeof rawSupabaseAnonKey === 'string' &&
    rawSupabaseAnonKey.trim().length > 0 &&
    !rawSupabaseAnonKey.includes('your-anon-key')
  );
}

export const SUPABASE_URL = rawSupabaseUrl.trim();
export const SUPABASE_ANON_KEY = rawSupabaseAnonKey.trim();

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazily creates or returns the singleton Supabase client.
 * If credentials are not configured, returns null without throwing errors.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: typeof window !== 'undefined',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          flowType: 'pkce',
        },
      });
    } catch (error) {
      console.warn('Erro ao inicializar cliente Supabase:', error);
      return null;
    }
  }

  return supabaseInstance;
}

export const supabase = getSupabaseClient();
