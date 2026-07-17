import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, determineNutritionStatus } from "@/lib/api-helpers";
import { NutritionStatus } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return errorResponse("childId query parameter is required", 400);
    }

    const records = await prisma.growthRecord.findMany({
      where: { childId },
      orderBy: { date: "desc" },
    });

    return successResponse(records);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch growth records", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const body = await request.json();
    const { childId, date, weightKg, heightCm, muacCm, nutritionStatus, notes } = body;

    if (!childId || !date) {
      return errorResponse("Child ID and measurement date are required", 400);
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return errorResponse("Child not found", 404);
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return errorResponse("Invalid measurement date", 400);
    }

    const parsedWeight = weightKg !== undefined && weightKg !== null ? parseFloat(weightKg) : null;
    const parsedHeight = heightCm !== undefined && heightCm !== null ? parseFloat(heightCm) : null;
    const parsedMuac = muacCm !== undefined && muacCm !== null ? parseFloat(muacCm) : null;

    // Determine status automatically if not explicitly provided
    const computedStatus: NutritionStatus =
      nutritionStatus || determineNutritionStatus(parsedMuac, parsedWeight, parsedHeight);

    const record = await prisma.growthRecord.create({
      data: {
        childId,
        date: parsedDate,
        weightKg: parsedWeight,
        heightCm: parsedHeight,
        muacCm: parsedMuac,
        nutritionStatus: computedStatus,
        notes: notes ? notes.trim() : null,
      },
    });

    return successResponse(record, 201);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to record growth measurement", 500);
  }
}
