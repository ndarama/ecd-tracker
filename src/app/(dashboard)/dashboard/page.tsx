import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  UsersIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

async function getStats(chwId: string, role: string) {
  const isAdmin = role === "ADMIN" || role === "SUPERVISOR";

  const [children, visitsToday, pendingReferrals, upcomingVisits] =
    await Promise.all([
      prisma.child.count({ where: isAdmin ? {} : { chwId } }),
      prisma.homeVisit.count({
        where: {
          ...(isAdmin ? {} : { chwId }),
          status: "COMPLETED",
          visitDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.referral.count({
        where: { status: "PENDING" },
      }),
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
  const stats = await getStats(session!.user.id, session!.user.role);

  const cards = [
    {
      label: "Registered Children",
      value: stats.children,
      icon: UsersIcon,
      color: "bg-emerald-50 text-emerald-700",
      ring: "ring-emerald-200",
    },
    {
      label: "Visits Today",
      value: stats.visitsToday,
      icon: ClipboardDocumentListIcon,
      color: "bg-blue-50 text-blue-700",
      ring: "ring-blue-200",
    },
    {
      label: "Upcoming Visits",
      value: stats.upcomingVisits,
      icon: CalendarDaysIcon,
      color: "bg-violet-50 text-violet-700",
      ring: "ring-violet-200",
    },
    {
      label: "Pending Referrals",
      value: stats.pendingReferrals,
      icon: ExclamationTriangleIcon,
      color: "bg-amber-50 text-amber-700",
      ring: "ring-amber-200",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, ring }) => (
          <div
            key={label}
            className={`bg-white rounded-xl p-5 ring-1 ${ring} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <span className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent children placeholder */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Recently Registered Children
          </h2>
          <p className="text-sm text-gray-400 text-center py-8">
            No children registered yet.
          </p>
        </div>

        {/* Upcoming visits placeholder */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Upcoming Home Visits
          </h2>
          <p className="text-sm text-gray-400 text-center py-8">
            No upcoming visits scheduled.
          </p>
        </div>
      </div>
    </div>
  );
}
