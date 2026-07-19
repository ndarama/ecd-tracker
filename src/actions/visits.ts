"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VisitStatus, ReferralStatus } from "@/generated/prisma/client";

export async function createVisit(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const followUpDate = formData.get("followUpDate") as string;

  await prisma.homeVisit.create({
    data: {
      childId: formData.get("childId") as string,
      chwId: session.user.id,
      visitDate: new Date(formData.get("visitDate") as string),
      observations: (formData.get("observations") as string) || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      status: (formData.get("status") as VisitStatus) ?? "SCHEDULED",
    },
  });

  const childId = formData.get("childId") as string;
  revalidatePath("/visits");
  revalidatePath(`/children/${childId}`);
  redirect("/visits");
}

export async function updateVisitStatus(id: string, status: VisitStatus) {
  const visit = await prisma.homeVisit.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/visits");
  revalidatePath(`/children/${visit.childId}`);
}

export async function createReferral(formData: FormData) {
  await prisma.referral.create({
    data: {
      childId: formData.get("childId") as string,
      reason: formData.get("reason") as string,
      facility: formData.get("facility") as string,
      referralDate: new Date(formData.get("referralDate") as string),
      status: "PENDING",
    },
  });

  const childId = formData.get("childId") as string;
  revalidatePath(`/children/${childId}`);
  redirect(`/children/${childId}`);
}

export async function updateReferralStatus(id: string, status: ReferralStatus) {
  const referral = await prisma.referral.update({
    where: { id },
    data: { status },
  });
  revalidatePath(`/children/${referral.childId}`);
}
