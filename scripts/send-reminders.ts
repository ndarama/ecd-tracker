import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { deliverPendingReminders } from "../src/lib/reminders";

async function main() {
  const result = await deliverPendingReminders();
  console.log(`Reminder delivery complete: ${result.sent} sent, ${result.failed} failed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
