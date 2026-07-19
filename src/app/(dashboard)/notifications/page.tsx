import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import Link from "next/link";
import { BellIcon, CalendarDaysIcon, BeakerIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default async function NotificationsPage() {
  const session = await auth();
  const isAdmin =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";
  const now = new Date();
  const in7days = addDays(now, 7);

  const [upcomingVisits, overdueVaccines, dueVaccines] = await Promise.all([
    // Scheduled visits in next 7 days
    prisma.homeVisit.findMany({
      where: {
        ...(isAdmin ? {} : { chwId: session!.user.id }),
        status: "SCHEDULED",
        visitDate: { gte: now, lte: in7days },
      },
      include: {
        child: { select: { id: true, firstName: true, lastName: true, village: true } },
      },
      orderBy: { visitDate: "asc" },
    }),
    // Overdue vaccines (dueDate < today, not given)
    prisma.immunization.findMany({
      where: {
        givenDate: null,
        dueDate: { lt: now },
        child: isAdmin ? {} : { chwId: session!.user.id },
      },
      include: {
        child: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 30,
    }),
    // Vaccines due in next 7 days
    prisma.immunization.findMany({
      where: {
        givenDate: null,
        dueDate: { gte: now, lte: in7days },
        child: isAdmin ? {} : { chwId: session!.user.id },
      },
      include: {
        child: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 30,
    }),
  ]);

  const total = upcomingVisits.length + overdueVaccines.length + dueVaccines.length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total > 0 ? `${total} items need attention` : "All up to date"}
        </p>
      </div>

      {/* Overdue vaccines */}
      {overdueVaccines.length > 0 && (
        <Section
          icon={<BeakerIcon className="w-5 h-5" />}
          title={`Overdue Vaccines (${overdueVaccines.length})`}
          color="red"
        >
          {overdueVaccines.map((v) => (
            <NotifRow
              key={v.id}
              title={`${v.child.firstName} ${v.child.lastName} — ${v.vaccine}`}
              sub={`Due ${format(v.dueDate, "dd MMM yyyy")}`}
              badge="OVERDUE"
              badgeColor="bg-red-100 text-red-700"
              href={`/children/${v.child.id}?tab=immunizations`}
            />
          ))}
        </Section>
      )}

      {/* Upcoming visits */}
      {upcomingVisits.length > 0 && (
        <Section
          icon={<CalendarDaysIcon className="w-5 h-5" />}
          title={`Upcoming Visits — Next 7 Days (${upcomingVisits.length})`}
          color="blue"
        >
          {upcomingVisits.map((v) => (
            <NotifRow
              key={v.id}
              title={`${v.child.firstName} ${v.child.lastName} · ${v.child.village}`}
              sub={format(v.visitDate, "EEEE, dd MMM yyyy")}
              badge="SCHEDULED"
              badgeColor="bg-blue-100 text-blue-700"
              href={`/children/${v.child.id}?tab=visits`}
            />
          ))}
        </Section>
      )}

      {/* Vaccines due soon */}
      {dueVaccines.length > 0 && (
        <Section
          icon={<BeakerIcon className="w-5 h-5" />}
          title={`Vaccines Due This Week (${dueVaccines.length})`}
          color="amber"
        >
          {dueVaccines.map((v) => (
            <NotifRow
              key={v.id}
              title={`${v.child.firstName} ${v.child.lastName} — ${v.vaccine}`}
              sub={`Due ${format(v.dueDate, "dd MMM yyyy")}`}
              badge="DUE SOON"
              badgeColor="bg-amber-100 text-amber-700"
              href={`/children/${v.child.id}?tab=immunizations`}
            />
          ))}
        </Section>
      )}

      {total === 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-14 text-center">
          <BellIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No notifications at this time.</p>
        </div>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  const headerColor =
    color === "red"
      ? "bg-red-50 border-red-200 text-red-800"
      : color === "blue"
      ? "bg-blue-50 border-blue-200 text-blue-800"
      : "bg-amber-50 border-amber-200 text-amber-800";

  const ringColor =
    color === "red"
      ? "ring-red-200"
      : color === "blue"
      ? "ring-blue-200"
      : "ring-amber-200";

  return (
    <div className={`bg-white rounded-xl ring-1 ${ringColor} overflow-hidden`}>
      <div className={`px-5 py-3 border-b ${headerColor} flex items-center gap-2`}>
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function NotifRow({
  title,
  sub,
  badge,
  badgeColor,
  href,
}: {
  title: string;
  sub: string;
  badge: string;
  badgeColor: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      <span className={clsx("text-xs px-2 py-0.5 rounded font-semibold", badgeColor)}>
        {badge}
      </span>
    </Link>
  );
}

