import { auth } from "@/lib/auth";
import {
  getReportDetails,
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
  const [stats, details, options] = await Promise.all([
    getReportStats(filters),
    getReportDetails(filters),
    getReportOptions(),
  ]);
  const completionRate = stats.visits.total > 0
    ? Math.round((stats.visits.completed / stats.visits.total) * 100)
    : 0;
  const exportParams = new URLSearchParams({ month: period.month });
  if (params.village) exportParams.set("village", params.village);
  if (params.chwId) exportParams.set("chwId", params.chwId);

  return (
    <div className="report-page space-y-6">
      <div className="no-print flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Reports</h1>
          <p className="mt-0.5 text-sm text-gray-500">Child health and follow-up records</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/export?${exportParams.toString()}`}
            className="inline-flex items-center rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Export Excel CSV
          </a>
          <PrintButton />
        </div>
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

        <section className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-gray-800">CHW performance</h3>
          {details.performance.length === 0 ? (
            <p className="text-sm text-gray-500">No CHW activity for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">CHW</th>
                    <th className="px-3 py-2">Children</th>
                    <th className="px-3 py-2">Visits</th>
                    <th className="px-3 py-2">Completed</th>
                    <th className="px-3 py-2">Pending referrals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.performance.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                      <td className="px-3 py-2 text-gray-600">{row.children}</td>
                      <td className="px-3 py-2 text-gray-600">{row.visits}</td>
                      <td className="px-3 py-2 text-gray-600">{row.completedVisits}</td>
                      <td className="px-3 py-2 text-gray-600">{row.pendingReferrals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-gray-800">Child-by-child health and follow-up</h3>
          {details.children.length === 0 ? (
            <p className="text-sm text-gray-500">No child records for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-2">Child</th>
                    <th className="px-3 py-2">Village</th>
                    <th className="px-3 py-2">CHW</th>
                    <th className="px-3 py-2">Growth</th>
                    <th className="px-3 py-2">Vaccines given</th>
                    <th className="px-3 py-2">Vaccines pending</th>
                    <th className="px-3 py-2">Visits</th>
                    <th className="px-3 py-2">Pending referrals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {details.children.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2 font-medium text-gray-800">{row.name}</td>
                      <td className="px-3 py-2 text-gray-600">{row.village}</td>
                      <td className="px-3 py-2 text-gray-600">{row.chwName}</td>
                      <td className="px-3 py-2 text-gray-600">{row.growthRecords}</td>
                      <td className="px-3 py-2 text-gray-600">{row.vaccinesGiven}</td>
                      <td className="px-3 py-2 text-gray-600">{row.vaccinesPending}</td>
                      <td className="px-3 py-2 text-gray-600">{row.visits}</td>
                      <td className="px-3 py-2 text-gray-600">{row.pendingReferrals}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

