import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import ws from "ws";
import * as schema from "@shared/schema";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_UbvtWd9Gcu5r@ep-orange-moon-a4zqsh6t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

export const db = drizzle(pool);
