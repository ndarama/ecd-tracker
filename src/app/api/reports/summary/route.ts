import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return errorResponse("Unauthorized access", 401);
    }

    const whereUser: { chwId?: string } = {};
    if (session.user.role === "CHW") {
      whereUser.chwId = session.user.id;
    }

    const now = new Date();

    const [
      totalChildren,
      totalVisits,
      completedVisits,
      scheduledVisits,
      overdueVaccines,
      completedVaccines,
      malnutritionCounts,
    ] = await Promise.all([
      prisma.child.count({ where: whereUser }),
      prisma.homeVisit.count({ where: whereUser }),
      prisma.homeVisit.count({
        where: { ...whereUser, status: "COMPLETED" },
      }),
      prisma.homeVisit.count({
        where: { ...whereUser, status: "SCHEDULED" },
      }),
      prisma.immunization.count({
        where: {
          givenDate: null,
          dueDate: { lt: now },
          child: whereUser.chwId ? { chwId: whereUser.chwId } : undefined,
        },
      }),
      prisma.immunization.count({
        where: {
          givenDate: { not: null },
          child: whereUser.chwId ? { chwId: whereUser.chwId } : undefined,
        },
      }),
      prisma.growthRecord.groupBy({
        by: ["nutritionStatus"],
        _count: {
          _all: true,
        },
        where: {
          child: whereUser.chwId ? { chwId: whereUser.chwId } : undefined,
        },
      }),
    ]);

    const malnutritionBreakdown = {
      NORMAL: 0,
      MODERATE_MALNUTRITION: 0,
      SEVERE_MALNUTRITION: 0,
      OVERWEIGHT: 0,
    };

    malnutritionCounts.forEach((item) => {
      if (item.nutritionStatus && item.nutritionStatus in malnutritionBreakdown) {
        malnutritionBreakdown[item.nutritionStatus as keyof typeof malnutritionBreakdown] =
          item._count._all;
      }
    });

    return successResponse({
      children: {
        total: totalChildren,
      },
      visits: {
        total: totalVisits,
        completed: completedVisits,
        scheduled: scheduledVisits,
        completionRate:
          totalVisits > 0 ? Number(((completedVisits / totalVisits) * 100).toFixed(1)) : 0,
      },
      immunizations: {
        completed: completedVaccines,
        overdue: overdueVaccines,
      },
      nutrition: malnutritionBreakdown,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return errorResponse(error.message || "Failed to generate summary report", 500);
  }
}
