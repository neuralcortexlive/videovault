import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Initialize Supabase client with anon key for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Initialize admin client with service role key for server-side operations
export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey)
  : supabase;

// Export a function to test the connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('collections').select('count');
    if (error) throw error;
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
}