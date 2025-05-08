import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to connect to Supabase?");
}

// Use Supabase connection URL from environment variables
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });