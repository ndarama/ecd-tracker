import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

async function getStats(chwId: string, role: string) {
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [children, visitsToday, pendingReferrals, upcomingVisits] =
    await Promise.all([
      prisma.child.count({ where: isAdmin ? {} : { chwId } }),
      prisma.homeVisit.count({
        where: {
          ...(isAdmin ? {} : { chwId }),
          status: "COMPLETED",
          visitDate: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.referral.count({ where: { status: "PENDING" } }),
      prisma.homeVisit.count({
        where: {
          ...(isAdmin ? {} : { chwId }),
          status: "SCHEDULED",
          visitDate: { gte: new Date() },
        },
      }),
    ]);

  return { children, visitsToday, pendingReferrals, upcomingVisits };
}

export default async function DashboardPage() {
  const session = await auth();
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";

  const [stats, recentChildren, upcomingVisits] = await Promise.all([
    getStats(session!.user.id, session!.user.role),
    prisma.child.findMany({
      where: isAdmin ? {} : { chwId: session!.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { visits: true } } },
    }),
    prisma.homeVisit.findMany({
      where: {
        ...(isAdmin ? {} : { chwId: session!.user.id }),
        status: "SCHEDULED",
        visitDate: { gte: new Date() },
      },
      orderBy: { visitDate: "asc" },
      take: 5,
      include: {
        child: { select: { firstName: true, lastName: true, village: true } },
      },
    }),
  ]);

  const cards = [
    {
      label: "Registered Children",
      value: stats.children,
      icon: UsersIcon,
      color: "bg-emerald-50 text-emerald-700",
      ring: "ring-emerald-200",
      href: "/children",
    },
    {
      label: "Visits Today",
      value: stats.visitsToday,
      icon: ClipboardDocumentListIcon,
      color: "bg-blue-50 text-blue-700",
      ring: "ring-blue-200",
      href: "/visits",
    },
    {
      label: "Upcoming Visits",
      value: stats.upcomingVisits,
      icon: CalendarDaysIcon,
      color: "bg-violet-50 text-violet-700",
      ring: "ring-violet-200",
      href: "/visits?status=SCHEDULED",
    },
    {
      label: "Pending Referrals",
      value: stats.pendingReferrals,
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

