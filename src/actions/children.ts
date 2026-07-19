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

  await prisma.child.create({
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: new Date(dob),
      gender: formData.get("gender") as Gender,
      village: formData.get("village") as string,
      caregiverName: formData.get("caregiverName") as string,
      caregiverPhone: (formData.get("caregiverPhone") as string) || null,
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

  await prisma.child.update({
    where: { id },
    data: {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      dateOfBirth: new Date(dob),
      gender: formData.get("gender") as Gender,
      village: formData.get("village") as string,
      caregiverName: formData.get("caregiverName") as string,
      caregiverPhone: (formData.get("caregiverPhone") as string) || null,
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
