import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { VisitStatus, Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    const status = searchParams.get("status") as VisitStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const whereClause: Prisma.HomeVisitWhereInput = {};
    if (childId) whereClause.childId = childId;
    if (status) whereClause.status = status;

    if (session.user.role === "CHW") {
      whereClause.chwId = session.user.id;
    }

    const [visits, total] = await Promise.all([
      prisma.homeVisit.findMany({
        where: whereClause,
        include: {
          child: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              village: true,
              caregiverName: true,
              caregiverPhone: true,
            },
          },
          chw: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { visitDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.homeVisit.count({ where: whereClause }),
    ]);

    return successResponse({
      visits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch visits", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const body = await request.json();
    const { childId, visitDate, observations, followUpDate, status } = body;

    if (!childId || !visitDate) {
      return errorResponse("Child ID and visit date are required", 400);
    }

    const child = await prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      return errorResponse("Referenced child does not exist", 404);
    }

    const parsedVisitDate = new Date(visitDate);
    if (isNaN(parsedVisitDate.getTime())) {
      return errorResponse("Invalid visit date", 400);
    }

    const parsedFollowUpDate = followUpDate ? new Date(followUpDate) : null;
    if (followUpDate && isNaN(parsedFollowUpDate!.getTime())) {
      return errorResponse("Invalid follow-up date", 400);
    }

    const visit = await prisma.homeVisit.create({
      data: {
        childId,
        chwId: session.user.id,
        visitDate: parsedVisitDate,
        observations: observations ? observations.trim() : null,
        followUpDate: parsedFollowUpDate,
        status: status || "SCHEDULED",
      },
      include: {
        child: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return successResponse(visit, 201);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to create home visit", 500);
  }
}
