import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, getSupabaseClient } from './supabaseClient';

describe('Supabase Client Safety & Configuration', () => {
  it('should evaluate isSupabaseConfigured safely without throwing', () => {
    const isConfigured = isSupabaseConfigured();
    expect(typeof isConfigured).toBe('boolean');
  });

  it('should return null or a client without crashing when invoked', () => {
    const client = getSupabaseClient();
    if (!isSupabaseConfigured()) {
      expect(client).toBeNull();
    } else {
      expect(client).toBeDefined();
    }
  });
});
