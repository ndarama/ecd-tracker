import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { updateVisitStatus } from "@/actions/visits";
import clsx from "clsx";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function VisitsPage({ searchParams }: Props) {
  const session = await auth();
  const { status } = await searchParams;
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";

  const visits = await prisma.homeVisit.findMany({
    where: {
      ...(isAdmin ? {} : { chwId: session!.user.id }),
      ...(status ? { status: status as never } : {}),
    },
    include: {
      child: { select: { firstName: true, lastName: true, village: true } },
      chw: { select: { name: true } },
    },
    orderBy: { visitDate: "desc" },
    take: 100,
  });

  const tabs = ["ALL", "SCHEDULED", "COMPLETED", "MISSED"];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Home Visits</h1>
        <p className="text-sm text-gray-500 mt-0.5">{visits.length} records</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => {
          const active = (status ?? "ALL") === t;
          const href = t === "ALL" ? "/visits" : `/visits?status=${t}`;
          return (
            <Link
              key={t}
              href={href}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              )}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </Link>
          );
        })}
      </div>

      {visits.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No visits found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Child</th>
                <th className="px-5 py-3">Village</th>
                <th className="px-5 py-3">Visit Date</th>
                <th className="px-5 py-3">Follow-up</th>
                <th className="px-5 py-3">Status</th>
                {isAdmin && <th className="px-5 py-3">CHW</th>}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visits.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    <Link
                      href={`/children/${v.childId}?tab=visits`}
                      className="hover:text-emerald-700"
                    >
                      {v.child.firstName} {v.child.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{v.child.village}</td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {format(v.visitDate, "dd MMM yyyy")}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {v.followUpDate
                      ? format(v.followUpDate, "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        STATUS_COLORS[v.status]
                      )}
                    >
                      {v.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5 text-gray-600">{v.chw.name}</td>
                  )}
                  <td className="px-5 py-3.5">
                    {v.status === "SCHEDULED" && (
                      <form action={updateVisitStatus.bind(null, v.id, "COMPLETED")}>
                        <button
                          type="submit"
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Complete
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

