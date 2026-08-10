import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { differenceInMonths, format } from "date-fns";
import GrowthTab from "./tabs/GrowthTab";
import NutritionTab from "./tabs/NutritionTab";
import ImmunizationsTab from "./tabs/ImmunizationsTab";
import MilestonesTab from "./tabs/MilestonesTab";
import VisitsTab from "./tabs/VisitsTab";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const TABS = ["overview", "growth", "nutrition", "immunizations", "milestones", "visits"];

export default async function ChildDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;

  const child = await prisma.child.findUnique({
      where: { id },
      include: {
        chw: { select: { name: true } },
        caregiver: { select: { name: true, phone: true } },
        household: { select: { address: true, village: true } },
        growthRecords: { orderBy: { date: "desc" } },
        nutritionScreenings: { orderBy: { date: "desc" } },
        immunizations: { orderBy: { dueDate: "asc" } },
        milestones: { orderBy: { createdAt: "desc" } },
        visits: {
          orderBy: { visitDate: "desc" },
          include: {
            chw: { select: { name: true } },
            reminders: { where: { status: { in: ["PENDING", "SENT"] } }, select: { id: true } },
          },
        },
        referrals: { orderBy: { referralDate: "desc" } },
      },
    });

  if (!child) notFound();

  const ageMonths = differenceInMonths(new Date(), child.dateOfBirth);
  const ageLabel =
    ageMonths < 24
      ? `${ageMonths} months`
      : `${Math.floor(ageMonths / 12)} years ${ageMonths % 12}m`;

  const latestGrowth = child.growthRecords[0];

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/children"
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {child.firstName} {child.lastName}
            </h1>
            <p className="text-sm text-gray-500">
              {child.gender === "MALE" ? "Male" : "Female"} · {ageLabel} ·{" "}
              {child.village}
            </p>
          </div>
          {child.profileImage && (
            <img
              src={child.profileImage}
              alt={`${child.firstName} ${child.lastName}`}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-100"
            />
          )}
        </div>
        <Link
          href={`/children/${id}/edit`}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Edit
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard label="Caregiver" value={child.caregiver?.name ?? "—"} />
            <InfoCard label="Phone" value={child.caregiver?.phone ?? "—"} />
        <InfoCard
          label="Weight"
          value={latestGrowth?.weightKg ? `${latestGrowth.weightKg} kg` : "—"}
        />
        <InfoCard
          label="Height"
          value={latestGrowth?.heightCm ? `${latestGrowth.heightCm} cm` : "—"}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((t) => (
            <Link
              key={t}
              href={`/children/${id}?tab=${t}`}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {tab === "overview" && (
          <OverviewTab child={child} />
        )}
        {tab === "growth" && (
          <GrowthTab childId={id} records={child.growthRecords} />
        )}
        {tab === "nutrition" && (
          <NutritionTab childId={id} records={child.nutritionScreenings} />
        )}
        {tab === "immunizations" && (
          <ImmunizationsTab childId={id} records={child.immunizations} />
        )}
        {tab === "milestones" && (
          <MilestonesTab childId={id} records={child.milestones} />
        )}
        {tab === "visits" && (
          <VisitsTab
            childId={id}
            visits={child.visits}
            referrals={child.referrals}
          />
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg ring-1 ring-gray-200 px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewTab({ child }: { child: any }) {
  const lastVisit = child.visits[0];
  const pendingImmunizations = child.immunizations.filter(
    (i: { givenDate: Date | null }) => !i.givenDate
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5 space-y-3">
        <h3 className="font-semibold text-gray-800">Child Details</h3>
        <dl className="space-y-2 text-sm">
          <Row label="Full Name" value={`${child.firstName} ${child.lastName}`} />
          <Row
            label="Date of Birth"
            value={format(child.dateOfBirth, "dd MMM yyyy")}
          />
          <Row label="Gender" value={child.gender === "MALE" ? "Male" : "Female"} />
          <Row label="Village" value={child.village} />
          <Row label="Caregiver" value={child.caregiver?.name ?? "—"} />
          <Row label="Phone" value={child.caregiver?.phone ?? "—"} />
          <Row label="Household address" value={child.household?.address ?? "—"} />
          <Row label="Assigned CHW" value={child.chw.name} />
          <Row
            label="Registered"
            value={format(child.createdAt, "dd MMM yyyy")}
          />
        </dl>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Last Visit</h3>
          {lastVisit ? (
            <dl className="space-y-2 text-sm">
              <Row label="Date" value={format(lastVisit.visitDate, "dd MMM yyyy")} />
              <Row label="Status" value={lastVisit.status} />
              <Row label="By" value={lastVisit.chw.name} />
              {lastVisit.observations && (
                <Row label="Observations" value={lastVisit.observations} />
              )}
              {lastVisit.recommendations && (
                <Row label="Recommendations" value={lastVisit.recommendations} />
              )}
              {lastVisit.followUpDate && (
                <Row
                  label="Follow-up Due"
                  value={format(lastVisit.followUpDate, "dd MMM yyyy")}
                />
              )}
            </dl>
          ) : (
            <p className="text-sm text-gray-400">No visits recorded.</p>
          )}
        </div>

        <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">
            Pending Immunizations
            {pendingImmunizations.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pendingImmunizations.length}
              </span>
            )}
          </h3>
          {pendingImmunizations.length === 0 ? (
            <p className="text-sm text-gray-400">All vaccines up to date.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pendingImmunizations
                .slice(0, 4)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((imm: any) => (
                  <li key={imm.id} className="flex justify-between">
                    <span className="text-gray-700">{imm.vaccine}</span>
                    <span className="text-gray-400">
                      Due {format(imm.dueDate, "dd MMM yyyy")}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800 text-right">{value}</dd>
    </div>
  );
}
