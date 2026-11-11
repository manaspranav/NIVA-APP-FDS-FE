/**
 * PARTNER-SPECIFIC Supabase Client
 * 
 * Uses a dedicated storageKey ('partner-auth') so that the partner
 * session is stored independently from customer / admin sessions.
 * This allows customer and partner to be logged in at the same time
 * in the same browser without session collisions.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const partnerSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'partner-auth',
    storage: window.localStorage
  }
});
