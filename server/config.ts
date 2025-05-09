import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";

// Load environment variables
dotenv.config();

// Function to set up environment variables from env.txt if needed
function setupEnvironmentVariables() {
  if (!process.env.DATABASE_URL && fs.existsSync("env.txt")) {
    const envContent = fs.readFileSync("env.txt", "utf-8");
    const envLines = envContent.split("\n");

    // Parse connection string and credentials
    const connectionString = envLines.find(line => line.includes("postgresql://"))?.trim();
    const pgUser = envLines.find(line => line.startsWith("PGUSER="))?.split("=")[1]?.trim();
    const pgPassword = envLines.find(line => line.startsWith("PGPASSWORD="))?.split("=")[1]?.trim();

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
const requiredEnvVars = ['DATABASE_URL'];

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
export async function validateConnections() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database');
    return false;
  }
  return true;
}