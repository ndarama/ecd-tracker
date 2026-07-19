/**
 * Seed script — creates default admin and CHW accounts.
 * Run: npx tsx prisma/seed.ts
 */
import path from "path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const dbUrl = "file:" + path.resolve("dev.db");
const adapter = new PrismaLibSql({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "admin@ecd.org" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@ecd.org",
      password,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "chw@ecd.org" },
    update: {},
    create: {
      name: "Jane Banda",
      email: "chw@ecd.org",
      password,
      role: "CHW",
      village: "Chitukuko",
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@ecd.org" },
    update: {},
    create: {
      name: "John Phiri",
      email: "supervisor@ecd.org",
      password,
      role: "SUPERVISOR",
    },
  });

  console.log("✅ Seed complete.");
  console.log("   admin@ecd.org / password123");
  console.log("   chw@ecd.org / password123");
  console.log("   supervisor@ecd.org / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
