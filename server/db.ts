import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use environment variable with fallback
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_jV8y7NgZraGo@ep-orange-moon-a4zqsh6t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Add error handling for pool creation
const createPool = () => {
  try {
    return new Pool({ connectionString: DATABASE_URL });
  } catch (error) {
    console.error('Failed to create database pool:', error);
    throw error;
  }
};

export const pool = createPool();
export const db = drizzle({ client: pool, schema });

// Test the connection
pool.connect()
  .then(() => console.log('Database connection successful'))
  .catch(err => {
    console.error('Database connection failed:', err);
    throw err;
  });