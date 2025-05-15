import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_d5K9jYrqaNlA@ep-snowy-art-a5leclp6.us-east-2.aws.neon.tech/neondb?sslmode=require",
  },
});
