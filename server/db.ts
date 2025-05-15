import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// URL do banco de dados Neon
const DATABASE_URL = "postgresql://neondb_owner:npg_d5K9jYrqaNlA@ep-snowy-art-a5leclp6.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Criar a pool de conexão
const pool = new Pool({ connectionString: DATABASE_URL });

// Inicializar o banco de dados
async function initializeDatabase() {
  try {
    const db = drizzle({ client: pool, schema });
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    return db;
  } catch (error: any) {
    console.error("Erro ao inicializar o banco de dados:", error);
    throw error;
  }
}

export const db = await initializeDatabase();
