import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Hardcoded database URL for better reliability
const DATABASE_URL = "postgresql://neondb_owner:npg_d5K9jYrqaNlA@ep-snowy-art-a5leclp6.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Use hardcoded URL, but fall back to environment variable if needed
const connectionString = DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Database connection string not available. Please check configuration.",
  );
}

// Script SQL para corrigir o problema da coluna thumbnail_url
const fixSchemaSQL = `
-- Verificar se a coluna thumbnail existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'videos' AND column_name = 'thumbnail';

-- Se não existir, criar a coluna thumbnail
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Se thumbnail_url existir e thumbnail não existir, copiar os dados
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'thumbnail_url'
    ) AND EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'thumbnail'
    ) THEN
        UPDATE videos 
        SET thumbnail = thumbnail_url 
        WHERE thumbnail IS NULL AND thumbnail_url IS NOT NULL;
    END IF;
END $$;

-- Renomear thumbnail_url para thumbnail, caso a coluna thumbnail não exista
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'thumbnail_url'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'videos' AND column_name = 'thumbnail'
    ) THEN
        ALTER TABLE videos RENAME COLUMN thumbnail_url TO thumbnail;
    END IF;
END $$;
`;

// Criar a pool de conexão
const pool = new Pool({ connectionString });

// Inicializar o banco de dados
async function initializeDatabase() {
  try {
    // Executar o script SQL para corrigir o schema
    await pool.query(fixSchemaSQL);
    console.log("Script de correção do schema executado com sucesso");
    
    const db = drizzle({ client: pool, schema });
    console.log("Conexão com o banco de dados estabelecida com sucesso");
    
    return db;
  } catch (error: any) {
    console.error("Erro ao inicializar o banco de dados:", error);
    if (error.message && error.message.includes("thumbnail_url")) {
      console.error("ERRO: Problema com a coluna 'thumbnail_url'. Verifique o schema do banco de dados.");
    }
    throw error;
  }
}

// Exportar a pool e inicializar o banco de dados
export { pool };
export const db = await initializeDatabase();
