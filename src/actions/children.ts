"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Gender } from "@/generated/prisma/client";

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

async function readProfileImage(formData: FormData) {
  const file = formData.get("profileImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) throw new Error("Profile image must be an image");
  if (file.size > MAX_PROFILE_IMAGE_BYTES) throw new Error("Profile image must be 2 MB or smaller");
  const bytes = await file.arrayBuffer();
  return `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function createChild(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  if (!session.user?.id) throw new Error("Authenticated user has no id in session");

  const chw = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!chw) throw new Error(`Authenticated user not found in database: ${session.user.id}`);

  const dob = formData.get("dateOfBirth") as string;

  const caregiverName = (formData.get("caregiverName") as string) || "";
  const caregiverPhone = (formData.get("caregiverPhone") as string) || null;
  const caregiverEmail = (formData.get("caregiverEmail") as string)?.trim().toLowerCase() || null;
  const village = (formData.get("village") as string) || "";
  const householdAddress = (formData.get("householdAddress") as string) || "";
  const profileImage = await readProfileImage(formData);

  const household = await prisma.household.create({
    data: { address: householdAddress, village },
  });

  let caregiver;
  if (caregiverPhone) {
    caregiver = await prisma.caregiver.upsert({
      where: { phone: caregiverPhone },
      update: { name: caregiverName, email: caregiverEmail, householdId: household.id },
      create: { name: caregiverName, phone: caregiverPhone, email: caregiverEmail, householdId: household.id },
    });
  } else {
    caregiver = await prisma.caregiver.create({
      data: { name: caregiverName, email: caregiverEmail, householdId: household.id },
    });
  }

  await prisma.child.create({
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: new Date(dob),
      gender: formData.get("gender") as Gender,
      village,
      profileImage,
      householdId: household.id,
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
  const caregiverEmail = (formData.get("caregiverEmail") as string)?.trim().toLowerCase() || null;
  const village = (formData.get("village") as string) || "";
  const householdAddress = (formData.get("householdAddress") as string) || "";
  const profileImage = await readProfileImage(formData);
  const existingChild = await prisma.child.findUnique({
    where: { id },
    include: { household: true },
  });
  if (!existingChild) throw new Error("Child not found");

  const household = existingChild.household
    ? await prisma.household.update({
        where: { id: existingChild.household.id },
        data: { address: householdAddress, village },
      })
    : await prisma.household.create({ data: { address: householdAddress, village } });

  // Determine or create caregiver
  let caregiverId: string | null = null;
  if (caregiverPhone) {
    const cg = await prisma.caregiver.upsert({
      where: { phone: caregiverPhone },
      update: { name: caregiverName, email: caregiverEmail, householdId: household.id },
      create: { name: caregiverName, phone: caregiverPhone, email: caregiverEmail, householdId: household.id },
    });
    caregiverId = cg.id;
  } else {
    // If child already has a caregiver, update it; otherwise create a new caregiver
    if (existingChild.caregiverId) {
      await prisma.caregiver.update({ where: { id: existingChild.caregiverId }, data: { name: caregiverName, email: caregiverEmail, householdId: household.id } });
      caregiverId = existingChild.caregiverId;
    } else {
      const cg = await prisma.caregiver.create({ data: { name: caregiverName, email: caregiverEmail, householdId: household.id } });
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
      village,
      householdId: household.id,
      caregiverId: caregiverId,
      ...(profileImage ? { profileImage } : {}),
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
