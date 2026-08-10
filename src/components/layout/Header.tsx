import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { addDays } from "date-fns";

async function getNotificationCount(chwId: string, isAdmin: boolean) {
  const now = new Date();
  const in7days = addDays(now, 7);
  const [overdueVaccines, upcomingVisits, overdueFollowUps, dueVaccines] = await Promise.all([
    prisma.immunization.count({
      where: {
        givenDate: null,
        dueDate: { lt: now },
        child: isAdmin ? {} : { chwId },
      },
    }),
    prisma.homeVisit.count({
      where: {
        ...(isAdmin ? {} : { chwId }),
        status: "SCHEDULED",
        visitDate: { gte: now, lte: in7days },
      },
    }),
    prisma.homeVisit.count({
      where: {
        ...(isAdmin ? {} : { chwId }),
        status: { not: "CANCELLED" },
        followUpDate: { lt: now },
      },
    }),
    prisma.immunization.count({
      where: {
        givenDate: null,
        dueDate: { gte: now, lte: in7days },
        child: isAdmin ? {} : { chwId },
      },
    }),
  ]);
  return overdueVaccines + upcomingVisits + overdueFollowUps + dueVaccines;
}

export default async function Header() {
  const session = await auth();
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";
  const notifCount = await getNotificationCount(session!.user.id, isAdmin);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <BellIcon className="w-5 h-5" />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </Link>
        <Link href="/account" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-800 leading-none">
              {session?.user?.name}
            </p>
            <p className="text-gray-500 text-xs mt-0.5 capitalize">
              {session?.user?.role?.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}

