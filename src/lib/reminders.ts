import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import type { Reminder } from "@/generated/prisma/client";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) throw new Error("SMTP is not configured");

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendReminderEmail(reminder: Reminder) {
  if (!reminder.caregiverEmail) throw new Error("Reminder has no caregiver email");
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!from) throw new Error("SMTP_FROM is not configured");

  await getTransporter().sendMail({
    from,
    to: reminder.caregiverEmail,
    subject: reminder.type === "VACCINE" ? "ECD vaccination reminder" : "ECD home visit reminder",
    text: reminder.message,
  });
}

export async function deliverPendingReminders(limit = 50) {
  const reminders = await prisma.reminder.findMany({
    where: { status: "PENDING", dueDate: { lte: new Date() } },
    orderBy: { dueDate: "asc" },
    take: limit,
  });

  const results = { sent: 0, failed: 0 };
  for (const reminder of reminders) {
    try {
      await sendReminderEmail(reminder);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date(), deliveryError: null },
      });
      results.sent += 1;
    } catch (error) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { deliveryError: error instanceof Error ? error.message : "Delivery failed" },
      });
      results.failed += 1;
    }
  }
  return results;
}
