import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/schema';

// Hardcoded Supabase connection details
const supabaseUrl = 'https://uysatbupbbnjbvgckays.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2F0YnVwYmJuamJ2Z2NrYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzYxMjksImV4cCI6MjA2MjI1MjEyOX0.NpqSkNBr2LZfGRsZm7JeTfi99zd_V5Lr8C54MAvdlKY';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2F0YnVwYmJuamJ2Z2NrYXlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY3NjEyOSwiZXhwIjoyMDYyMjUyMTI5fQ.v1Wz5QFGSVvmw7AQC2KZhY_2dJPbJxqHPVXOqyB8KDg';

// Initialize Supabase client with anon key for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Initialize admin client with service role key for server-side operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

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