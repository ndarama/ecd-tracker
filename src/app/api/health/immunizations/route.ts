import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const status = searchParams.get("status"); // "overdue" | "completed" | "pending"

    const whereClause: Prisma.ImmunizationWhereInput = {};
    if (childId) whereClause.childId = childId;

    const now = new Date();
    if (status === "overdue") {
      whereClause.givenDate = null;
      whereClause.dueDate = { lt: now };
    } else if (status === "completed") {
      whereClause.givenDate = { not: null };
    } else if (status === "pending") {
      whereClause.givenDate = null;
      whereClause.dueDate = { gte: now };
    }

    const immunizations = await prisma.immunization.findMany({
      where: whereClause,
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true, village: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return successResponse(immunizations);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch immunizations", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const body = await request.json();
    const { childId, vaccine, dueDate, givenDate, batchNumber, notes } = body;

    if (!childId || !vaccine || !dueDate) {
      return errorResponse("childId, vaccine and dueDate are required", 400);
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return errorResponse("Child not found", 404);
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return errorResponse("Invalid due date", 400);
    }

    const parsedGivenDate = givenDate ? new Date(givenDate) : null;
    if (givenDate && isNaN(parsedGivenDate!.getTime())) {
      return errorResponse("Invalid given date", 400);
    }

    const immunization = await prisma.immunization.create({
      data: {
        childId,
        vaccine: vaccine.trim(),
        dueDate: parsedDueDate,
        givenDate: parsedGivenDate,
        batchNumber: batchNumber ? batchNumber.trim() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    return successResponse(immunization, 201);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to create immunization", 500);
  }
}
