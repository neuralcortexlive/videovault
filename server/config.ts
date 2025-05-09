import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Function to set up environment variables from env.txt if needed
function setupEnvironmentVariables() {
  // Only read from env.txt if essential variables are missing
  if (!process.env.SUPABASE_URL && fs.existsSync("env.txt")) {
    const envContent = fs.readFileSync("env.txt", "utf-8");
    const envLines = envContent.split("\n");

    // Parse connection string and credentials
    const connectionString = envLines.find(line => line.includes("postgresql://"))?.trim();
    const pgUser = envLines.find(line => line.startsWith("PGUSER="))?.split("=")[1]?.trim();
    const pgPassword = envLines.find(line => line.startsWith("PGPASSWORD="))?.split("=")[1]?.trim();

    // Set environment variables if found
    if (connectionString) {
      process.env.DATABASE_URL = connectionString;
    }
    if (pgUser) {
      process.env.PGUSER = pgUser;
    }
    if (pgPassword) {
      process.env.PGPASSWORD = pgPassword;
    }
  }
}

// Initialize environment variables
setupEnvironmentVariables();

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Configure database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configure Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export configured instances
export const db = {
  pool,
  query: (text: string, params?: any[]) => pool.query(text, params),
  connect: () => pool.connect(),
};

// Test connection function
export async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
}

// YouTube API configuration
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDmhH5AZ52qIIIKN-l2r1LXK40Qi5JW7Q8';

// Export connection testing utilities
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('collections').select('count');
    if (error) throw error;
    console.log('Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
};