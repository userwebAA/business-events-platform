import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig, Pool } from '@neondatabase/serverless';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  console.log('[Prisma] DATABASE_URL exists:', !!dbUrl);
  console.log('[Prisma] DATABASE_URL starts with:', dbUrl?.substring(0, 30));

  if (!dbUrl) {
    throw new Error('[Prisma] DATABASE_URL is not set! Check Vercel environment variables.');
  }

  neonConfig.fetchConnectionCache = true;
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaNeon(pool as any);
  return new PrismaClient({ adapter, log: ['error', 'warn'] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
