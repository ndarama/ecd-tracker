import { format } from "date-fns";
import { createVisit, createVisitReminder, updateVisitStatus } from "@/actions/visits";
import { createReferral, updateReferralStatus } from "@/actions/visits";
import type { HomeVisit, Referral } from "@/generated/prisma/client";
import clsx from "clsx";

const VISIT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

const REFERRAL_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface Props {
  childId: string;
  visits: (HomeVisit & { chw: { name: string }; reminders: { id: string }[] })[];
  referrals: Referral[];
}

export default function VisitsTab({ childId, visits, referrals }: Props) {
  return (
    <div className="space-y-6">
      {/* Record Visit */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Record Home Visit</h3>
        <form action={createVisit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="hidden" name="childId" value={childId} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Visit Date <span className="text-red-500">*</span>
            </label>
            <input
              name="visitDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              name="status"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="COMPLETED">Completed</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="MISSED">Missed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Follow-up Date
            </label>
            <input
              name="followUpDate"
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Observations
            </label>
            <textarea
              name="observations"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Recommendations
            </label>
            <textarea
              name="recommendations"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Save Visit
            </button>
          </div>
        </form>
      </div>

      {/* Visit history */}
      {visits.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-sm">
              Visit History ({visits.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {visits.map((v) => (
              <div key={v.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {format(v.visitDate, "dd MMM yyyy")}
                      </span>
                      <span
                        className={clsx(
                          "text-xs px-2 py-0.5 rounded font-medium",
                          VISIT_STATUS_COLORS[v.status]
                        )}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">By {v.chw.name}</p>
                    {v.observations && (
                      <p className="text-sm text-gray-700 mt-1">{v.observations}</p>
                    )}
                    {v.recommendations && (
                      <p className="text-sm text-emerald-700 mt-1">
                        Recommendations: {v.recommendations}
                      </p>
                    )}
                    {v.followUpDate && (
                      <p className="text-xs text-blue-600 mt-1">
                        Follow-up: {format(v.followUpDate, "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  {v.status === "SCHEDULED" && (
                    <div className="flex gap-2 shrink-0">
                      {v.reminders.length === 0 && (
                        <form action={createVisitReminder.bind(null, v.id)}>
                          <button
                            type="submit"
                            className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                          >
                            Remind caregiver
                          </button>
                        </form>
                      )}
                      <form action={updateVisitStatus.bind(null, v.id, "COMPLETED")}>
                        <button
                          type="submit"
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >
                          Mark Completed
                        </button>
                      </form>
                      <form action={updateVisitStatus.bind(null, v.id, "MISSED")}>
                        <button
                          type="submit"
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Mark Missed
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referrals */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Create Referral</h3>
        <form action={createReferral} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="hidden" name="childId" value={childId} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Referral Date <span className="text-red-500">*</span>
            </label>
            <input
              name="referralDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Facility <span className="text-red-500">*</span>
            </label>
            <input
              name="facility"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              name="reason"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Create Referral
            </button>
          </div>
        </form>

        {referrals.length > 0 && (
          <div className="mt-5 divide-y divide-gray-100">
            {referrals.map((r) => (
              <div key={r.id} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.facility}</p>
                  <p className="text-xs text-gray-500">{r.reason}</p>
                  <p className="text-xs text-gray-400">
                    {format(r.referralDate, "dd MMM yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded font-medium",
                      REFERRAL_STATUS_COLORS[r.status]
                    )}
                  >
                    {r.status}
                  </span>
                  {r.status === "PENDING" && (
                    <form action={updateReferralStatus.bind(null, r.id, "COMPLETED")}>
                      <button
                        type="submit"
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Mark Done
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
