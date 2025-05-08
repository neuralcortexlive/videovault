import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

const runMigrations = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Running migrations...");

  await migrate(db, {
    migrationsFolder: "supabase/migrations"
  });

  console.log("Migrations completed!");
  await pool.end();
};

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});