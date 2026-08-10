"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReminderStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

async function updateReminderStatus(id: string, status: ReminderStatus) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: { child: { select: { chwId: true } } },
  });
  if (!reminder) throw new Error("Reminder not found");
  const canManage =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPERVISOR" ||
    reminder.child.chwId === session.user.id;
  if (!canManage) throw new Error("Forbidden");
  if (reminder.status === "CANCELLED" || reminder.status === "COMPLETED") {
    throw new Error("Reminder is already closed");
  }

  await prisma.reminder.update({ where: { id }, data: { status } });
  revalidatePath("/notifications");
}

export async function completeReminder(id: string) {
  return updateReminderStatus(id, "COMPLETED");
}

export async function cancelReminder(id: string) {
  return updateReminderStatus(id, "CANCELLED");
}
