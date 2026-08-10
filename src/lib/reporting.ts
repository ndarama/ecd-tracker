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

export interface ReportChildRow {
  id: string;
  name: string;
  village: string;
  chwName: string;
  growthRecords: number;
  vaccinesGiven: number;
  vaccinesPending: number;
  visits: number;
  pendingReferrals: number;
}

export interface ReportChwRow {
  id: string;
  name: string;
  children: number;
  visits: number;
  completedVisits: number;
  pendingReferrals: number;
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

export async function getReportDetails(filters: ReportFilters = {}) {
  const range = parseReportDateRange(filters);
  const relatedChild = childWhere(filters);
  const childFilter = { ...relatedChild, ...dateWhere("createdAt", range) };
  const growthFilter = { child: relatedChild, ...dateWhere("date", range) };
  const immunizationFilter = { child: relatedChild, ...dateWhere("dueDate", range) };
  const visitFilter = { child: relatedChild, ...dateWhere("visitDate", range) };
  const referralFilter = { child: relatedChild, ...dateWhere("referralDate", range) };

  const [children, growth, immunizations, visits, referrals, chws, chwVisits] = await Promise.all([
    prisma.child.findMany({
      where: childFilter,
      select: { id: true, firstName: true, lastName: true, village: true, chw: { select: { id: true, name: true } } },
      orderBy: [{ village: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.growthRecord.groupBy({ by: ["childId"], _count: { _all: true }, where: growthFilter }),
    prisma.immunization.groupBy({
      by: ["childId", "givenDate"],
      _count: { _all: true },
      where: immunizationFilter,
    }),
    prisma.homeVisit.groupBy({ by: ["childId", "status"], _count: { _all: true }, where: visitFilter }),
    prisma.referral.groupBy({ by: ["childId", "status"], _count: { _all: true }, where: referralFilter }),
    prisma.user.findMany({ where: { role: "CHW" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.homeVisit.groupBy({ by: ["chwId", "status"], _count: { _all: true }, where: visitFilter }),
  ]);

  const growthByChild = new Map(growth.map((row) => [row.childId, row._count._all]));
  const immunizationByChild = new Map<string, { given: number; pending: number }>();
  for (const row of immunizations) {
    const current = immunizationByChild.get(row.childId) ?? { given: 0, pending: 0 };
    if (row.givenDate) current.given += row._count._all;
    else current.pending += row._count._all;
    immunizationByChild.set(row.childId, current);
  }
  const visitsByChild = new Map<string, number>();
  for (const row of visits) visitsByChild.set(row.childId, (visitsByChild.get(row.childId) ?? 0) + row._count._all);
  const pendingReferralsByChild = new Map<string, number>();
  for (const row of referrals) {
    if (row.status === "PENDING") pendingReferralsByChild.set(row.childId, row._count._all);
  }

  const childRows: ReportChildRow[] = children.map((child) => {
    const vaccine = immunizationByChild.get(child.id) ?? { given: 0, pending: 0 };
    return {
      id: child.id,
      name: `${child.firstName} ${child.lastName}`,
      village: child.village,
      chwName: child.chw.name,
      growthRecords: growthByChild.get(child.id) ?? 0,
      vaccinesGiven: vaccine.given,
      vaccinesPending: vaccine.pending,
      visits: visitsByChild.get(child.id) ?? 0,
      pendingReferrals: pendingReferralsByChild.get(child.id) ?? 0,
    };
  });

  const childrenByChw = new Map<string, number>();
  for (const child of children) childrenByChw.set(child.chw.id, (childrenByChw.get(child.chw.id) ?? 0) + 1);
  const visitsByChw = new Map<string, { total: number; completed: number }>();
  for (const row of chwVisits) {
    const current = visitsByChw.get(row.chwId) ?? { total: 0, completed: 0 };
    current.total += row._count._all;
    if (row.status === "COMPLETED") current.completed += row._count._all;
    visitsByChw.set(row.chwId, current);
  }
  const pendingReferralsByChw = new Map<string, number>();
  for (const child of children) {
    const pending = pendingReferralsByChild.get(child.id) ?? 0;
    pendingReferralsByChw.set(child.chw.id, (pendingReferralsByChw.get(child.chw.id) ?? 0) + pending);
  }
  const performance: ReportChwRow[] = chws
    .filter((chw) => childrenByChw.has(chw.id) || visitsByChw.has(chw.id))
    .map((chw) => ({
      id: chw.id,
      name: chw.name,
      children: childrenByChw.get(chw.id) ?? 0,
      visits: visitsByChw.get(chw.id)?.total ?? 0,
      completedVisits: visitsByChw.get(chw.id)?.completed ?? 0,
      pendingReferrals: pendingReferralsByChw.get(chw.id) ?? 0,
    }));

  return { children: childRows, performance };
}
