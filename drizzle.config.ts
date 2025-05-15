import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: "postgresql://neondb_owner:npg_UbvtWd9Gcu5r@ep-orange-moon-a4zqsh6t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
  },
  verbose: true,
  strict: true,
} satisfies Config;
