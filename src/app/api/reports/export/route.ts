import { auth } from "@/lib/auth";
import { getReportDetails, getReportStats } from "@/lib/reporting";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { NextResponse } from "next/server";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function monthBounds(month: string | null) {
  const selected = month && /^\d{4}-\d{2}$/.test(month)
    ? new Date(`${month}-01T00:00:00`)
    : new Date();
  return {
    label: format(selected, "MMMM yyyy"),
    from: format(startOfMonth(selected), "yyyy-MM-dd"),
    to: format(endOfMonth(selected), "yyyy-MM-dd"),
  };
}

export async function GET(request: Request) {
  const session = await auth();
  const canReport = session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";
  if (!canReport) return new NextResponse("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const period = monthBounds(url.searchParams.get("month"));
  const filters = {
    village: url.searchParams.get("village") || undefined,
    chwId: url.searchParams.get("chwId") || undefined,
    from: period.from,
    to: period.to,
  };
  const [stats, details] = await Promise.all([
    getReportStats(filters),
    getReportDetails(filters),
  ]);

  const rows: string[][] = [
    ["ECD Child Health Report", period.label],
    [],
    ["Aggregate statistics", "Value"],
    ["Registered children", stats.registeredChildren.toString()],
    ["Growth records", stats.growthRecords.toString()],
    ["Immunizations total", stats.immunizations.total.toString()],
    ["Immunizations given", stats.immunizations.given.toString()],
    ["Immunizations pending", stats.immunizations.pending.toString()],
    ["Immunizations overdue", stats.immunizations.overdue.toString()],
    ["Home visits total", stats.visits.total.toString()],
    ["Home visits completed", stats.visits.completed.toString()],
    ["Home visits scheduled", stats.visits.scheduled.toString()],
    ["Home visits missed", stats.visits.missed.toString()],
    ["Referrals total", stats.referrals.total.toString()],
    ["Referrals pending", stats.referrals.pending.toString()],
    ["Referrals completed", stats.referrals.completed.toString()],
    [],
    ["CHW performance", "Children", "Visits", "Completed visits", "Pending referrals"],
    ...details.performance.map((row) => [row.name, row.children.toString(), row.visits.toString(), row.completedVisits.toString(), row.pendingReferrals.toString()]),
    [],
    ["Child detail", "Village", "CHW", "Growth records", "Vaccines given", "Vaccines pending", "Visits", "Pending referrals"],
    ...details.children.map((row) => [row.name, row.village, row.chwName, row.growthRecords.toString(), row.vaccinesGiven.toString(), row.vaccinesPending.toString(), row.visits.toString(), row.pendingReferrals.toString()]),
  ];

  const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecd-report-${format(new Date(period.from), "yyyy-MM")}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
