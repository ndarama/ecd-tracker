import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { VisitStatus, Prisma } from "@/generated/prisma/client";

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
    const visit = await prisma.homeVisit.findUnique({
      where: { id },
      include: {
        child: true,
        chw: { select: { id: true, name: true, email: true } },
      },
    });

    if (!visit) {
      return errorResponse("Home visit not found", 404);
    }

    return successResponse(visit);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to fetch visit", 500);
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
    const existing = await prisma.homeVisit.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse("Home visit not found", 404);
    }

    if (session.user.role === "CHW" && existing.chwId !== session.user.id) {
      return errorResponse("Forbidden: You cannot modify this visit record", 403);
    }

    const body = await request.json();
    const dataToUpdate: Prisma.HomeVisitUpdateInput = {};

    if (body.status) {
      const validStatuses: VisitStatus[] = ["SCHEDULED", "COMPLETED", "MISSED", "CANCELLED"];
      if (!validStatuses.includes(body.status)) {
        return errorResponse("Invalid visit status", 400);
      }
      dataToUpdate.status = body.status;
    }

    if (body.observations !== undefined) {
      dataToUpdate.observations = body.observations ? body.observations.trim() : null;
    }

    if (body.followUpDate !== undefined) {
      if (body.followUpDate === null) {
        dataToUpdate.followUpDate = null;
      } else {
        const d = new Date(body.followUpDate);
        if (isNaN(d.getTime())) return errorResponse("Invalid follow-up date", 400);
        dataToUpdate.followUpDate = d;
      }
    }

    const updated = await prisma.homeVisit.update({
      where: { id },
      data: dataToUpdate,
      include: {
        child: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return successResponse(updated);
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to update home visit", 500);
  }
}
