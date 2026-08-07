import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow, differenceInMonths } from "date-fns";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ChildrenPage({ searchParams }: Props) {
  const session = await auth();
  const { q } = await searchParams;
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";

  const children = await prisma.child.findMany({
    where: {
      ...(isAdmin ? {} : { chwId: session!.user.id }),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { caregiverName: { contains: q } },
              { caregiver: { name: { contains: q } } },
              { village: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      chw: { select: { name: true } },
      caregiver: { select: { name: true } },
      _count: { select: { visits: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {children.length} registered
          </p>
        </div>
        <Link
          href="/children/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Register Child
        </Link>
      </div>

      {/* Search */}
      <form method="get" className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, caregiver, or village…"
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </form>

      {/* Table */}
      {children.length === 0 ? (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No children found.</p>
          <Link
            href="/children/new"
            className="mt-3 inline-block text-sm text-emerald-600 hover:underline"
          >
            Register the first child
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Age</th>
                <th className="px-5 py-3">Village</th>
                <th className="px-5 py-3">Caregiver</th>
                {isAdmin && <th className="px-5 py-3">CHW</th>}
                <th className="px-5 py-3">Visits</th>
                <th className="px-5 py-3">Registered</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {children.map((child) => {
                const ageMonths = differenceInMonths(
                  new Date(),
                  child.dateOfBirth
                );
                const ageLabel =
                  ageMonths < 24
                    ? `${ageMonths}m`
                    : `${Math.floor(ageMonths / 12)}y`;

                return (
                  <tr key={child.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {child.firstName} {child.lastName}
                      <span className="ml-2 text-xs text-gray-400">
                        {child.gender === "MALE" ? "M" : "F"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{ageLabel}</td>
                    <td className="px-5 py-3.5 text-gray-600">{child.village}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {child.caregiver?.name ?? child.caregiverName}
                    </td>
                    {isAdmin && (
                      <td className="px-5 py-3.5 text-gray-600">
                        {child.chw.name}
                      </td>
                    )}
                    <td className="px-5 py-3.5 text-gray-600">
                      {child._count.visits}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {formatDistanceToNow(child.createdAt, {
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/children/${child.id}`}
                        className="text-emerald-600 hover:text-emerald-800 font-medium text-xs"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

