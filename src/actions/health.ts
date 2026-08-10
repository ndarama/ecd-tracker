"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NutritionStatus, MilestoneCategory } from "@/generated/prisma/client";

export async function createGrowthRecord(formData: FormData) {
  const childId = formData.get("childId") as string;

  await prisma.growthRecord.create({
    data: {
      childId,
      date: new Date(formData.get("date") as string),
      weightKg: parseFloat(formData.get("weightKg") as string) || null,
      heightCm: parseFloat(formData.get("heightCm") as string) || null,
      muacCm: parseFloat(formData.get("muacCm") as string) || null,
      nutritionStatus:
        (formData.get("nutritionStatus") as NutritionStatus) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/children/${childId}`);
  redirect(`/children/${childId}?tab=growth`);
}

export async function createImmunization(formData: FormData) {
  const childId = formData.get("childId") as string;
  const givenDate = formData.get("givenDate") as string;

  await prisma.immunization.create({
    data: {
      childId,
      vaccine: formData.get("vaccine") as string,
      dueDate: new Date(formData.get("dueDate") as string),
      givenDate: givenDate ? new Date(givenDate) : null,
      batchNumber: (formData.get("batchNumber") as string) || null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/children/${childId}`);
  redirect(`/children/${childId}?tab=immunizations`);
}

export async function markImmunizationGiven(id: string, childId: string) {
  await prisma.immunization.update({
    where: { id },
    data: { givenDate: new Date() },
  });
  revalidatePath(`/children/${childId}`);
}

export async function createVaccineReminder(immunizationId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const immunization = await prisma.immunization.findUnique({
    where: { id: immunizationId },
    include: { child: { include: { caregiver: true } } },
  });
  if (!immunization) throw new Error("Immunization not found");
  const canManageReminder =
    session.user.role === "ADMIN" ||
    session.user.role === "SUPERVISOR" ||
    immunization.child.chwId === session.user.id;
  if (!canManageReminder) throw new Error("Forbidden");
  if (immunization.givenDate) throw new Error("This vaccine has already been given");

  const existing = await prisma.reminder.findFirst({
    where: { immunizationId, status: "PENDING" },
  });
  if (!existing) {
    await prisma.reminder.create({
      data: {
        childId: immunization.childId,
        immunizationId,
        type: "VACCINE",
        dueDate: immunization.dueDate,
        caregiverName: immunization.child.caregiver?.name ?? immunization.child.caregiverName,
        caregiverPhone: immunization.child.caregiver?.phone ?? immunization.child.caregiverPhone,
        message: `Reminder for ${immunization.child.firstName} ${immunization.child.lastName}: ${immunization.vaccine} is due on ${immunization.dueDate.toISOString().slice(0, 10)}.`,
      },
    });
  }

  revalidatePath("/notifications");
  revalidatePath(`/children/${immunization.childId}`);
}

export async function createMilestone(formData: FormData) {
  const childId = formData.get("childId") as string;
  const achievedDate = formData.get("achievedDate") as string;

  await prisma.milestone.create({
    data: {
      childId,
      category: formData.get("category") as MilestoneCategory,
      description: formData.get("description") as string,
      achievedDate: achievedDate ? new Date(achievedDate) : null,
      notes: (formData.get("notes") as string) || null,
    },
  });

  revalidatePath(`/children/${childId}`);
  redirect(`/children/${childId}?tab=milestones`);
}
