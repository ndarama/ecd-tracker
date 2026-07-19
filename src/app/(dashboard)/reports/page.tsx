import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfMonth, endOfMonth } from "date-fns";

export default async function ReportsPage() {
  const session = await auth();
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    totalChildren,
    childrenThisMonth,
    totalVisits,
    completedVisits,
    missedVisits,
    scheduledVisits,
    pendingReferrals,
    completedReferrals,
    nutritionData,
    villageData,
    chwData,
  ] = await Promise.all([
    prisma.child.count(),
    prisma.child.count({
      where: { createdAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.homeVisit.count(),
    prisma.homeVisit.count({ where: { status: "COMPLETED" } }),
    prisma.homeVisit.count({ where: { status: "MISSED" } }),
    prisma.homeVisit.count({ where: { status: "SCHEDULED" } }),
    prisma.referral.count({ where: { status: "PENDING" } }),
    prisma.referral.count({ where: { status: "COMPLETED" } }),
    prisma.growthRecord.groupBy({
      by: ["nutritionStatus"],
      _count: { _all: true },
      where: { nutritionStatus: { not: null } },
    }),
    prisma.child.groupBy({
      by: ["village"],
      _count: { _all: true },
      orderBy: { _count: { village: "desc" } },
      take: 8,
    }),
    isAdmin
      ? prisma.user.findMany({
          where: { role: "CHW" },
          include: {
            _count: { select: { children: true, visits: true } },
          },
        })
      : [],
  ]);

  const visitRate =
    totalVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {format(now, "MMMM yyyy")} · System overview
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Children" value={totalChildren} sub={`+${childrenThisMonth} this month`} color="emerald" />
        <StatCard label="Visit Completion" value={`${visitRate}%`} sub={`${completedVisits} of ${totalVisits}`} color="blue" />
        <StatCard label="Scheduled Visits" value={scheduledVisits} sub="upcoming" color="violet" />
        <StatCard label="Pending Referrals" value={pendingReferrals} sub={`${completedReferrals} resolved`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visit breakdown */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Visit Status Breakdown</h2>
          <div className="space-y-3">
            <Bar label="Completed" value={completedVisits} total={totalVisits} color="bg-green-500" />
            <Bar label="Scheduled" value={scheduledVisits} total={totalVisits} color="bg-blue-500" />
            <Bar label="Missed" value={missedVisits} total={totalVisits} color="bg-red-400" />
          </div>
        </div>

        {/* Nutrition */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Nutrition Status (All Records)</h2>
          {nutritionData.length === 0 ? (
            <p className="text-sm text-gray-400">No growth records yet.</p>
          ) : (
            <div className="space-y-3">
              {nutritionData.map((n) => (
                <div key={String(n.nutritionStatus)} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-44 shrink-0">
                    {formatNutrition(String(n.nutritionStatus))}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round(
                          (n._count._all /
                            nutritionData.reduce((s, x) => s + x._count._all, 0)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-6 text-right">
                    {n._count._all}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Children by village */}
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Children by Village</h2>
          {villageData.length === 0 ? (
            <p className="text-sm text-gray-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {villageData.map((v) => (
                <Bar
                  key={v.village}
                  label={v.village}
                  value={v._count._all}
                  total={totalChildren}
                  color="bg-emerald-500"
                />
              ))}
            </div>
          )}
        </div>

        {/* CHW performance (admins only) */}
        {isAdmin && (chwData as typeof chwData).length > 0 && (
          <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">CHW Performance</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <th className="pb-2">CHW</th>
                  <th className="pb-2">Children</th>
                  <th className="pb-2">Visits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(chwData as typeof chwData).map((chw) => (
                  <tr key={chw.id}>
                    <td className="py-2.5 text-gray-800 font-medium">{chw.name}</td>
                    <td className="py-2.5 text-gray-600">{chw._count.children}</td>
                    <td className="py-2.5 text-gray-600">{chw._count.visits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  const ring =
    color === "emerald"
      ? "ring-emerald-200"
      : color === "blue"
      ? "ring-blue-200"
      : color === "violet"
      ? "ring-violet-200"
      : "ring-amber-200";

  return (
    <div className={`bg-white rounded-xl ring-1 ${ring} p-5 shadow-sm`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm text-gray-500 w-8 text-right">{value}</span>
    </div>
  );
}

function formatNutrition(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

