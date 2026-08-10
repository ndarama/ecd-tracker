import { auth } from "@/lib/auth";
import {
  getReportOptions,
  getReportStats,
} from "@/lib/reporting";
import { endOfMonth, format, startOfMonth } from "date-fns";
import PrintButton from "@/components/reports/PrintButton";

interface Props {
  searchParams: Promise<{
    month?: string;
    village?: string;
    chwId?: string;
  }>;
}

function monthBounds(month: string | undefined) {
  const selected = month && /^\d{4}-\d{2}$/.test(month)
    ? new Date(`${month}-01T00:00:00`)
    : new Date();

  return {
    month: format(selected, "yyyy-MM"),
    from: format(startOfMonth(selected), "yyyy-MM-dd"),
    to: format(endOfMonth(selected), "yyyy-MM-dd"),
    label: format(selected, "MMMM yyyy"),
  };
}

export default async function ReportsPage({ searchParams }: Props) {
  const session = await auth();
  const canReport =
    session?.user.role === "ADMIN" || session?.user.role === "SUPERVISOR";
  const params = await searchParams;
  const period = monthBounds(params.month);

  if (!canReport) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-10 text-center">
        <h1 className="text-lg font-semibold text-gray-900">Reports unavailable</h1>
        <p className="mt-2 text-sm text-gray-500">Only supervisors and administrators can view reports.</p>
      </div>
    );
  }

  const filters = {
    village: params.village,
    chwId: params.chwId,
    from: period.from,
    to: period.to,
  };
  const [stats, options] = await Promise.all([
    getReportStats(filters),
    getReportOptions(),
  ]);
  const completionRate = stats.visits.total > 0
    ? Math.round((stats.visits.completed / stats.visits.total) * 100)
    : 0;

  return (
    <div className="report-page space-y-6">
      <div className="no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">Child health and follow-up records</p>
        </div>
        <PrintButton />
      </div>

      <form method="get" className="no-print bg-white rounded-xl ring-1 ring-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input name="month" type="month" defaultValue={period.month} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select name="village" defaultValue={params.village ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All villages</option>
          {options.villages.map((village) => <option key={village} value={village}>{village}</option>)}
        </select>
        <select name="chwId" defaultValue={params.chwId ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All CHWs</option>
          {options.chws.map((chw) => <option key={chw.id} value={chw.id}>{chw.name}</option>)}
        </select>
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Generate report</button>
        <a href="/reports" className="rounded-lg border border-gray-300 px-3 py-2 text-center text-sm text-gray-600">Reset</a>
      </form>

      <article className="report-document bg-white rounded-xl ring-1 ring-gray-200 p-6 shadow-sm">
        <header className="border-b border-gray-200 pb-5">
          <h2 className="text-xl font-bold text-gray-900">ECD Child Health Report</h2>
          <p className="mt-1 text-sm text-gray-500">Reporting period: {period.label}</p>
          <p className="text-sm text-gray-500">
            {params.village ? `Village: ${params.village}` : "All villages"} · {params.chwId ? "Filtered CHW" : "All CHWs"}
          </p>
        </header>

        <section className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportCard label="Registered children" value={stats.registeredChildren} />
          <ReportCard label="Growth records" value={stats.growthRecords} />
          <ReportCard label="Home visits" value={stats.visits.total} />
          <ReportCard label="Referrals" value={stats.referrals.total} />
        </section>

        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <ReportSection title="Immunization status">
            <ReportRow label="Given" value={stats.immunizations.given} />
            <ReportRow label="Pending" value={stats.immunizations.pending} />
            <ReportRow label="Overdue" value={stats.immunizations.overdue} />
          </ReportSection>
          <ReportSection title="Home visit status">
            <ReportRow label="Completed" value={stats.visits.completed} />
            <ReportRow label="Scheduled" value={stats.visits.scheduled} />
            <ReportRow label="Missed" value={stats.visits.missed} />
            <ReportRow label="Completion rate" value={`${completionRate}%`} />
          </ReportSection>
          <ReportSection title="Referral status">
            <ReportRow label="Pending" value={stats.referrals.pending} />
            <ReportRow label="Completed" value={stats.referrals.completed} />
            <ReportRow label="Cancelled" value={stats.referrals.cancelled} />
          </ReportSection>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-gray-800">Growth and nutrition</h3>
          {stats.nutrition.length === 0 ? (
            <p className="text-sm text-gray-500">No nutrition records for this period.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.nutrition.map((item) => <ReportCard key={item.status} label={item.status.replaceAll("_", " ")} value={item.count} />)}
            </div>
          )}
        </section>

        <footer className="mt-10 border-t border-gray-200 pt-4 text-xs text-gray-500">
          Generated {format(new Date(), "dd MMM yyyy, HH:mm")}
        </footer>
      </article>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4 ring-1 ring-gray-200">
      <p className="text-xs capitalize text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-gray-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

