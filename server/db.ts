import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/schema';

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
export const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);