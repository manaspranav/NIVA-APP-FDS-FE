/**
 * RESTAURANT OWNER-SPECIFIC Supabase Client
 * 
 * Uses a dedicated storageKey ('restaurant-auth') so that the restaurant
 * owner session is stored independently from customer / partner / admin sessions.
 * This allows multiple roles to be logged in at the same time
 * in the same browser without session collisions.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const restaurantSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'restaurant-auth',
    storage: window.localStorage
  }
});
