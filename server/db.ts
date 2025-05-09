import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configure Neon
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineTLS = true;
neonConfig.pipelineConnect = true;

// Validate database URL
const validateDatabaseUrl = (url: string) => {
  if (!url) {
    throw new Error('Database URL is required');
  }
  if (!url.includes('sslmode=require')) {
    throw new Error('Database URL must include sslmode=require for secure connections');
  }
  if (!url.startsWith('postgres://') && !url.startsWith('postgresql://')) {
    throw new Error('Invalid database URL protocol');
  }
  return url;
};

// Get and validate DATABASE_URL
const DATABASE_URL = validateDatabaseUrl(
  process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_UbvtWd9Gcu5r@ep-orange-moon-a4zqsh6t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
);

// Create the SQL executor
const sql = neon(DATABASE_URL);

// Create drizzle instance
export const db = drizzle(sql, { schema });

// Test the connection
const testConnection = async () => {
  try {
    const result = await sql`SELECT 1`;
    console.log('Database connection successful');
    return result;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

// Export the sql executor for direct usage
export { sql };

// Initialize connection
testConnection().catch(error => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});