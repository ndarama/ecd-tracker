import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL. Set DATABASE_URL to your PostgreSQL connection string."
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
