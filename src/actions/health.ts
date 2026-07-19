"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
