import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { Gender, Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const village = searchParams.get("village")?.trim() || "";
    const gender = searchParams.get("gender") as Gender | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ChildWhereInput = {};

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { caregiverName: { contains: search } },
      ];
    }

    if (village) {
      whereClause.village = { contains: village };
    }

    if (gender && (gender === "MALE" || gender === "FEMALE")) {
      whereClause.gender = gender;
    }

    // Role filtering: CHW sees only their assigned children; SUPERVISOR and ADMIN see all
    if (session.user.role === "CHW") {
      whereClause.chwId = session.user.id;
    }

    const [children, total] = await Promise.all([
      prisma.child.findMany({
        where: whereClause,
        include: {
          chw: {
            select: { id: true, name: true, email: true, village: true },
          },
          growthRecords: {
            orderBy: { date: "desc" },
            take: 1,
          },
          immunizations: {
            where: { givenDate: null },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.child.count({ where: whereClause }),
    ]);

    return successResponse({
      children,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch children", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const body = await request.json();
    const { firstName, lastName, dateOfBirth, gender, village, caregiverName, caregiverPhone } =
      body;

    if (!firstName || !lastName || !dateOfBirth || !gender || !village || !caregiverName) {
      return errorResponse("Missing required fields", 400);
    }

    if (gender !== "MALE" && gender !== "FEMALE") {
      return errorResponse("Invalid gender. Must be MALE or FEMALE", 400);
    }

    const parsedDob = new Date(dateOfBirth);
    if (isNaN(parsedDob.getTime())) {
      return errorResponse("Invalid date of birth", 400);
    }

    const child = await prisma.child.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: parsedDob,
        gender,
        village: village.trim(),
        caregiverName: caregiverName.trim(),
        caregiverPhone: caregiverPhone?.trim() || null,
        chwId: session.user.id,
      },
      include: {
        chw: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return successResponse(child, 201);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to register child", 500);
  }
}
