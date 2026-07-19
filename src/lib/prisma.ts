import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  // Resolve absolute path from DATABASE_URL env or fall back to root dev.db
  const envUrl = process.env.DATABASE_URL;
  const dbUrl = envUrl?.startsWith("file:./")
    ? "file:" + path.resolve(envUrl.slice("file:./".length))
    : envUrl ?? ("file:" + path.resolve("dev.db"));
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
