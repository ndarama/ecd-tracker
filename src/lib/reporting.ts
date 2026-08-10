import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface ReportFilters {
  village?: string;
  chwId?: string;
  from?: string;
  to?: string;
}

export interface ReportDateRange {
  from?: Date;
  to?: Date;
}

export interface ReportStats {
  registeredChildren: number;
  growthRecords: number;
  nutrition: Array<{ status: string; count: number }>;
  immunizations: {
    total: number;
    given: number;
    pending: number;
    overdue: number;
  };
  visits: {
    total: number;
    scheduled: number;
    completed: number;
    missed: number;
    cancelled: number;
  };
  referrals: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
}

export function parseReportDateRange(filters: ReportFilters): ReportDateRange {
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : undefined;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;

  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

function childWhere(filters: ReportFilters): Prisma.ChildWhereInput {
  return {
    ...(filters.village ? { village: filters.village } : {}),
    ...(filters.chwId ? { chwId: filters.chwId } : {}),
  };
}

function dateWhere(dateField: string, range: ReportDateRange) {
  if (!range.from && !range.to) return {};

  return {
    [dateField]: {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    },
  };
}

export async function getReportStats(filters: ReportFilters = {}): Promise<ReportStats> {
  const range = parseReportDateRange(filters);
  const relatedChild = childWhere(filters);
  const childDate = dateWhere("createdAt", range);
  const growthDate = dateWhere("date", range);
  const immunizationDate = dateWhere("dueDate", range);
  const visitDate = dateWhere("visitDate", range);
  const referralDate = dateWhere("referralDate", range);

  const [
    registeredChildren,
    growthRecords,
    nutrition,
    immunizations,
    givenImmunizations,
    pendingImmunizations,
    overdueImmunizations,
    visits,
    scheduledVisits,
    completedVisits,
    missedVisits,
    cancelledVisits,
    referrals,
    pendingReferrals,
    completedReferrals,
    cancelledReferrals,
  ] = await Promise.all([
    prisma.child.count({ where: { ...childWhere(filters), ...childDate } }),
    prisma.growthRecord.count({ where: { child: relatedChild, ...growthDate } }),
    prisma.growthRecord.groupBy({
      by: ["nutritionStatus"],
      _count: { _all: true },
      where: {
        child: relatedChild,
        nutritionStatus: { not: null },
        ...growthDate,
      },
    }),
    prisma.immunization.count({ where: { child: relatedChild, ...immunizationDate } }),
    prisma.immunization.count({
      where: { child: relatedChild, givenDate: { not: null }, ...immunizationDate },
    }),
    prisma.immunization.count({
      where: { child: relatedChild, givenDate: null, ...immunizationDate },
    }),
    prisma.immunization.count({
      where: {
        child: relatedChild,
        givenDate: null,
        dueDate: {
          lt: new Date(),
          ...(range.from ? { gte: range.from } : {}),
          ...(range.to ? { lte: range.to } : {}),
        },
      },
    }),
    prisma.homeVisit.count({ where: { child: relatedChild, ...visitDate } }),
    prisma.homeVisit.count({ where: { child: relatedChild, status: "SCHEDULED", ...visitDate } }),
    prisma.homeVisit.count({ where: { child: relatedChild, status: "COMPLETED", ...visitDate } }),
    prisma.homeVisit.count({ where: { child: relatedChild, status: "MISSED", ...visitDate } }),
    prisma.homeVisit.count({ where: { child: relatedChild, status: "CANCELLED", ...visitDate } }),
    prisma.referral.count({ where: { child: relatedChild, ...referralDate } }),
    prisma.referral.count({ where: { child: relatedChild, status: "PENDING", ...referralDate } }),
    prisma.referral.count({ where: { child: relatedChild, status: "COMPLETED", ...referralDate } }),
    prisma.referral.count({ where: { child: relatedChild, status: "CANCELLED", ...referralDate } }),
  ]);

  return {
    registeredChildren,
    growthRecords,
    nutrition: nutrition.map((record) => ({
      status: String(record.nutritionStatus),
      count: record._count._all,
    })),
    immunizations: {
      total: immunizations,
      given: givenImmunizations,
      pending: pendingImmunizations,
      overdue: overdueImmunizations,
    },
    visits: {
      total: visits,
      scheduled: scheduledVisits,
      completed: completedVisits,
      missed: missedVisits,
      cancelled: cancelledVisits,
    },
    referrals: {
      total: referrals,
      pending: pendingReferrals,
      completed: completedReferrals,
      cancelled: cancelledReferrals,
    },
  };
}

export async function getReportOptions() {
  const [villages, chws] = await Promise.all([
    prisma.child.findMany({
      distinct: ["village"],
      select: { village: true },
      orderBy: { village: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "CHW" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    villages: villages.map((record) => record.village),
    chws,
  };
}
