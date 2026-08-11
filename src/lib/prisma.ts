import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function resolveDatabaseUrl() {
  const envUrl = process.env.DATABASE_URL;

  if (envUrl) {
    return envUrl.startsWith("file:./")
      ? "file:" + path.resolve(envUrl.slice("file:./".length))
      : envUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing DATABASE_URL in production. Set DATABASE_URL to your production database connection string and do not use file:./dev.db in production."
    );
  }

  return "file:" + path.resolve("dev.db");
}

function createPrismaClient() {
  const dbUrl = resolveDatabaseUrl();
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
