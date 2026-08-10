import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getReportOptions, getReportStats, parseReportDateRange } from "@/lib/reporting";
import Link from "next/link";
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { differenceInMonths, format, formatDistanceToNow } from "date-fns";
import clsx from "clsx";

const VISIT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Props {
  searchParams: Promise<{ village?: string; chwId?: string; from?: string; to?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";
  const params = await searchParams;
  const filters = {
    ...params,
    ...(isAdmin ? {} : { chwId: session!.user.id }),
  };
  const dateRange = parseReportDateRange(filters);
  const childWhere = {
    ...(filters.village ? { village: filters.village } : {}),
    ...(filters.chwId ? { chwId: filters.chwId } : {}),
    ...(dateRange.from || dateRange.to
      ? { createdAt: { ...(dateRange.from ? { gte: dateRange.from } : {}), ...(dateRange.to ? { lte: dateRange.to } : {}) } }
      : {}),
  };

  const [stats, recentChildren, upcomingVisits, options] = await Promise.all([
    getReportStats(filters),
    prisma.child.findMany({
      where: childWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { visits: true } } },
    }),
    prisma.homeVisit.findMany({
      where: {
        child: childWhere,
        status: "SCHEDULED",
        visitDate: { gte: new Date() },
      },
      orderBy: { visitDate: "asc" },
      take: 5,
      include: {
        child: { select: { firstName: true, lastName: true, village: true } },
      },
    }),
    isAdmin ? getReportOptions() : Promise.resolve({ villages: [], chws: [] }),
  ]);

  const cards = [
    {
      label: "Registered Children",
      value: stats.registeredChildren,
      icon: UsersIcon,
      color: "bg-emerald-50 text-emerald-700",
      ring: "ring-emerald-200",
      href: "/children",
    },
    {
      label: "Completed Visits",
      value: stats.visits.completed,
      icon: ClipboardDocumentListIcon,
      color: "bg-blue-50 text-blue-700",
      ring: "ring-blue-200",
      href: "/visits",
    },
    {
      label: "Upcoming Visits",
      value: stats.visits.scheduled,
      icon: CalendarDaysIcon,
      color: "bg-violet-50 text-violet-700",
      ring: "ring-violet-200",
      href: "/visits?status=SCHEDULED",
    },
    {
      label: "Pending Referrals",
      value: stats.referrals.pending,
      icon: ExclamationTriangleIcon,
      color: "bg-amber-50 text-amber-700",
      ring: "ring-amber-200",
      href: "/reports",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {session?.user?.name} ·{" "}
          {format(new Date(), "EEEE, dd MMM yyyy")}
        </p>
      </div>

      {isAdmin && (
        <form method="get" className="dashboard-filters bg-white rounded-xl ring-1 ring-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select name="village" defaultValue={params.village ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All villages</option>
            {options.villages.map((village) => <option key={village} value={village}>{village}</option>)}
          </select>
          <select name="chwId" defaultValue={params.chwId ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">All CHWs</option>
            {options.chws.map((chw) => <option key={chw.id} value={chw.id}>{chw.name}</option>)}
          </select>
          <input name="from" type="date" defaultValue={params.from} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <input name="to" type="date" defaultValue={params.to} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Filter</button>
            <Link href="/dashboard" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600">Reset</Link>
          </div>
        </form>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, ring, href }) => (
          <Link
            key={label}
            href={href}
            className={`bg-white rounded-xl p-5 ring-1 ${ring} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <span className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Child Health Statistics</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Growth records" value={stats.growthRecords} />
            <Metric label="Vaccines given" value={stats.immunizations.given} />
            <Metric label="Vaccines pending" value={stats.immunizations.pending} />
            <Metric label="Vaccines overdue" value={stats.immunizations.overdue} />
          </div>
          {stats.nutrition.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3 space-y-2">
              {stats.nutrition.map((item) => <Metric key={item.status} label={item.status.replaceAll("_", " ")} value={item.count} />)}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Follow-up Records</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Visits completed" value={stats.visits.completed} />
            <Metric label="Visits missed" value={stats.visits.missed} />
            <Metric label="Visits scheduled" value={stats.visits.scheduled} />
            <Metric label="Pending referrals" value={stats.referrals.pending} />
            <Metric label="Completed referrals" value={stats.referrals.completed} />
          </div>
        </div>
        {/* Recent children */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Recently Registered
            </h2>
            <Link
              href="/children"
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              View all →
            </Link>
          </div>
          {recentChildren.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No children registered yet.{" "}
              <Link href="/children/new" className="text-emerald-600 hover:underline">
                Register one
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentChildren.map((child) => {
                const ageMonths = differenceInMonths(
                  new Date(),
                  child.dateOfBirth
                );
                const age =
                  ageMonths < 24
                    ? `${ageMonths}m`
                    : `${Math.floor(ageMonths / 12)}y`;
                return (
                  <li key={child.id}>
                    <Link
                      href={`/children/${child.id}`}
                      className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {child.firstName} {child.lastName}
                          <span className="ml-1 text-xs text-gray-400">
                            {child.gender === "MALE" ? "M" : "F"} · {age}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(child.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {child._count.visits} visit
                        {child._count.visits !== 1 ? "s" : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Upcoming visits */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Upcoming Home Visits
            </h2>
            <Link
              href="/visits?status=SCHEDULED"
              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
            >
              View all →
            </Link>
          </div>
          {upcomingVisits.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">
              No upcoming visits scheduled.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcomingVisits.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/children/${v.childId}?tab=visits`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {v.child.firstName} {v.child.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {v.child.village} ·{" "}
                        {format(v.visitDate, "EEE, dd MMM yyyy")}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        VISIT_STATUS_COLORS[v.status]
                      )}
                    >
                      {v.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-500 capitalize">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

