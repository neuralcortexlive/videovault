import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with Supabase connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL
    }
  }
});

export { prisma };