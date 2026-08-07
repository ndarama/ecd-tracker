"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gender } from "@/generated/prisma/client";

export async function createChild(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const dob = formData.get("dateOfBirth") as string;

  const caregiverName = (formData.get("caregiverName") as string) || "";
  const caregiverPhone = (formData.get("caregiverPhone") as string) || null;
  const village = (formData.get("village") as string) || undefined;

  let caregiver;
  if (caregiverPhone) {
    caregiver = await prisma.caregiver.upsert({
      where: { phone: caregiverPhone },
      update: { name: caregiverName, village },
      create: { name: caregiverName, phone: caregiverPhone, village },
    });
  } else {
    caregiver = await prisma.caregiver.create({
      data: { name: caregiverName, phone: null, village },
    });
  }

  await prisma.child.create({
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: new Date(dob),
      gender: formData.get("gender") as Gender,
      village: formData.get("village") as string,
      caregiverName: caregiverName,
      caregiverPhone: caregiverPhone,
      caregiverId: caregiver.id,
      chwId: session.user.id,
    },
  });

  revalidatePath("/children");
  redirect("/children");
}

export async function updateChild(id: string, formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const dob = formData.get("dateOfBirth") as string;

  const caregiverName = (formData.get("caregiverName") as string) || "";
  const caregiverPhone = (formData.get("caregiverPhone") as string) || null;
  const village = (formData.get("village") as string) || undefined;

  // Determine or create caregiver
  let caregiverId: string | null = null;
  if (caregiverPhone) {
    const cg = await prisma.caregiver.upsert({
      where: { phone: caregiverPhone },
      update: { name: caregiverName, village },
      create: { name: caregiverName, phone: caregiverPhone, village },
    });
    caregiverId = cg.id;
  } else {
    // If child already has a caregiver, update it; otherwise create a new caregiver
    const existing = await prisma.child.findUnique({ where: { id }, select: { caregiverId: true } });
    if (existing?.caregiverId) {
      await prisma.caregiver.update({ where: { id: existing.caregiverId }, data: { name: caregiverName, village } });
      caregiverId = existing.caregiverId;
    } else {
      const cg = await prisma.caregiver.create({ data: { name: caregiverName, phone: null, village } });
      caregiverId = cg.id;
    }
  }

  await prisma.child.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: new Date(dob),
      gender: formData.get("gender") as Gender,
      village: formData.get("village") as string,
      caregiverName: caregiverName,
      caregiverPhone: caregiverPhone,
      caregiverId: caregiverId,
    },
  });

  revalidatePath("/children");
  revalidatePath(`/children/${id}`);
  redirect(`/children/${id}`);
}

export async function deleteChild(id: string) {
  await prisma.child.delete({ where: { id } });
  revalidatePath("/children");
  redirect("/children");
}
