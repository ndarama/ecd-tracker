"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: formData.get("name") as string,
      village: (formData.get("village") as string) || null,
      phone: (formData.get("phone") as string) || null,
    },
  });

  revalidatePath("/account");
  redirect("/account?saved=1");
}

export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const current = formData.get("current") as string;
  const next = formData.get("next") as string;
  const confirm = formData.get("confirm") as string;

  if (next !== confirm) {
    redirect("/account?error=mismatch");
  }
  if (next.length < 8) {
    redirect("/account?error=short");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(current, user.password);
  if (!valid) {
    redirect("/account?error=wrong");
  }

  const hashed = await bcrypt.hash(next, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  });

  redirect("/account?saved=1");
}
