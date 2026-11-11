import { createClient } from '@supabase/supabase-js';
import { createMockSupabase } from './devMockSupabase';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase =
  process.env.REACT_APP_DEV_MOCK === 'true'
    ? createMockSupabase()
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'supabase.auth.token',
          storage: window.localStorage
        }
      });
