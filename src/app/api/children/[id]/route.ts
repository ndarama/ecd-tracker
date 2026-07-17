import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { Gender, Prisma } from "@/generated/prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { id } = await params;
    const child = await prisma.child.findUnique({
      where: { id },
      include: {
        chw: {
          select: { id: true, name: true, email: true, phone: true, village: true },
        },
        growthRecords: {
          orderBy: { date: "desc" },
        },
        immunizations: {
          orderBy: { dueDate: "asc" },
        },
        milestones: {
          orderBy: { createdAt: "desc" },
        },
        visits: {
          include: { chw: { select: { id: true, name: true } } },
          orderBy: { visitDate: "desc" },
        },
        referrals: {
          orderBy: { referralDate: "desc" },
        },
      },
    });

    if (!child) {
      return errorResponse("Child not found", 404);
    }

    if (session.user.role === "CHW" && child.chwId !== session.user.id) {
      return errorResponse("Forbidden: You do not have access to this record", 403);
    }

    return successResponse(child);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch child detail", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { id } = await params;
    const existing = await prisma.child.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Child not found", 404);
    }

    if (session.user.role === "CHW" && existing.chwId !== session.user.id) {
      return errorResponse("Forbidden: You cannot modify this child record", 403);
    }

    const body = await request.json();
    const dataToUpdate: Prisma.ChildUpdateInput = {};

    if (body.firstName) dataToUpdate.firstName = body.firstName.trim();
    if (body.lastName) dataToUpdate.lastName = body.lastName.trim();
    if (body.dateOfBirth) {
      const dob = new Date(body.dateOfBirth);
      if (isNaN(dob.getTime())) return errorResponse("Invalid date of birth", 400);
      dataToUpdate.dateOfBirth = dob;
    }
    if (body.gender) {
      if (body.gender !== "MALE" && body.gender !== "FEMALE") {
        return errorResponse("Invalid gender. Must be MALE or FEMALE", 400);
      }
      dataToUpdate.gender = body.gender as Gender;
    }
    if (body.village) dataToUpdate.village = body.village.trim();
    if (body.caregiverName) dataToUpdate.caregiverName = body.caregiverName.trim();
    if (body.caregiverPhone !== undefined) {
      dataToUpdate.caregiverPhone = body.caregiverPhone ? body.caregiverPhone.trim() : null;
    }

    const updated = await prisma.child.update({
      where: { id },
      data: dataToUpdate,
    });

    return successResponse(updated);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to update child", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { id } = await params;
    const existing = await prisma.child.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Child not found", 404);
    }

    // Only Supervisor/Admin or assigned CHW can delete
    if (session.user.role === "CHW" && existing.chwId !== session.user.id) {
      return errorResponse("Forbidden: You cannot delete this child record", 403);
    }

    await prisma.child.delete({ where: { id } });

    return successResponse({ message: "Child deleted successfully", id });
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to delete child", 500);
  }
}
