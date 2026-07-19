import { format } from "date-fns";
import { createMilestone } from "@/actions/health";
import type { Milestone } from "@/generated/prisma/client";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

const CATEGORIES = ["MOTOR", "LANGUAGE", "COGNITIVE", "SOCIAL"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  MOTOR: "bg-blue-100 text-blue-700",
  LANGUAGE: "bg-violet-100 text-violet-700",
  COGNITIVE: "bg-amber-100 text-amber-700",
  SOCIAL: "bg-green-100 text-green-700",
};

export default function MilestonesTab({
  childId,
  records,
}: {
  childId: string;
  records: Milestone[];
}) {
  const achieved = records.filter((r) => r.achievedDate);
  const pending = records.filter((r) => !r.achievedDate);

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Add Milestone</h3>
        <form action={createMilestone} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input type="hidden" name="childId" value={childId} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0) + c.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              name="description"
              required
              placeholder="e.g. Walks independently"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date Achieved
            </label>
            <input
              name="achievedDate"
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input
              name="notes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No milestones recorded yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...achieved, ...pending].map((m) => (
            <div
              key={m.id}
              className={`bg-white rounded-xl ring-1 p-4 flex gap-3 ${
                m.achievedDate ? "ring-green-200" : "ring-gray-200"
              }`}
            >
              <CheckBadgeIcon
                className={`w-5 h-5 mt-0.5 shrink-0 ${
                  m.achievedDate ? "text-green-500" : "text-gray-300"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${CATEGORY_COLORS[m.category]}`}
                  >
                    {m.category.charAt(0) + m.category.slice(1).toLowerCase()}
                  </span>
                  {m.achievedDate && (
                    <span className="text-xs text-green-600">
                      {format(m.achievedDate, "dd MMM yyyy")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-800 mt-1">{m.description}</p>
                {m.notes && (
                  <p className="text-xs text-gray-500 mt-0.5">{m.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
