import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

interface EnvironmentConfig {
  name: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function getEnvironmentConfig(): { url: string; key: string; name: string } {
  // Check localStorage for LovaSync environment override
  const stored = localStorage.getItem('lovasync_environment');
  if (stored) {
    try {
      const config: EnvironmentConfig = JSON.parse(stored);
      console.log('[LovaSync] Using environment:', config.name);
      return {
        url: config.supabaseUrl,
        key: config.supabaseAnonKey,
        name: config.name
      };
    } catch (e) {
      console.warn('[LovaSync] Invalid environment config, using default');
    }
  }
  
  // Default production config
  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    name: 'production'
  };
}

const config = getEnvironmentConfig();

export const supabaseEnv: SupabaseClient<Database> = createClient<Database>(
  config.url, 
  config.key,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export const currentEnvironment = config.name;

// Re-export for convenience - use this when you need environment switching
export { supabaseEnv as supabase };
