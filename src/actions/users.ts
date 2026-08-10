"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

function required(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readRole(formData: FormData) {
  const role = required(formData, "role");
  if (!Object.values(Role).includes(role as Role)) throw new Error("Invalid role");
  return role as Role;
}

function readEmail(formData: FormData) {
  const email = required(formData, "email").toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Invalid email");
  return email;
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const name = required(formData, "name");
  const email = readEmail(formData);
  const password = required(formData, "password");
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/users?error=email");

  await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: readRole(formData),
      village: String(formData.get("village") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
    },
  });

  revalidatePath("/users");
  redirect("/users?saved=created");
}

export async function updateUser(id: string, formData: FormData) {
  const session = await requireAdmin();
  const name = required(formData, "name");
  const email = readEmail(formData);
  const password = String(formData.get("password") ?? "").trim();

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error("User not found");
  const emailOwner = await prisma.user.findUnique({ where: { email } });
  if (emailOwner && emailOwner.id !== id) redirect(`/users/${id}/edit?error=email`);
  if (session.user.id === id && readRole(formData) !== "ADMIN") {
    throw new Error("You cannot remove your own administrator role");
  }
  if (password && password.length < 8) throw new Error("Password must be at least 8 characters");

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role: readRole(formData),
      village: String(formData.get("village") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
    },
  });

  revalidatePath("/users");
  revalidatePath(`/users/${id}/edit`);
  redirect("/users?saved=updated");
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) redirect("/users?error=self");

  const user = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { children: true, visits: true } } },
  });
  if (!user) redirect("/users?error=missing");
  if (user._count.children > 0 || user._count.visits > 0) {
    redirect("/users?error=assigned");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  redirect("/users?saved=deleted");
}
