import { format } from "date-fns";
import { createGrowthRecord } from "@/actions/health";
import type { GrowthRecord } from "@/generated/prisma/client";

const NUTRITION_LABELS: Record<string, string> = {
  NORMAL: "Normal",
  MODERATE_MALNUTRITION: "Moderate Malnutrition",
  SEVERE_MALNUTRITION: "Severe Malnutrition",
  OVERWEIGHT: "Overweight",
};

const NUTRITION_COLORS: Record<string, string> = {
  NORMAL: "bg-green-100 text-green-700",
  MODERATE_MALNUTRITION: "bg-amber-100 text-amber-700",
  SEVERE_MALNUTRITION: "bg-red-100 text-red-700",
  OVERWEIGHT: "bg-blue-100 text-blue-700",
};

export default function GrowthTab({
  childId,
  records,
}: {
  childId: string;
  records: GrowthRecord[];
}) {
  return (
    <div className="space-y-5">
      {/* Add record form */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Record Growth Measurement</h3>
        <form action={createGrowthRecord} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="hidden" name="childId" value={childId} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Weight (kg)
            </label>
            <input
              name="weightKg"
              type="number"
              step="0.1"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Height (cm)
            </label>
            <input
              name="heightCm"
              type="number"
              step="0.1"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              MUAC (cm)
            </label>
            <input
              name="muacCm"
              type="number"
              step="0.1"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nutrition Status
            </label>
            <select
              name="nutritionStatus"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select…</option>
              {Object.entries(NUTRITION_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Notes
            </label>
            <input
              name="notes"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      </div>

      {/* History */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Weight</th>
                <th className="px-5 py-3">Height</th>
                <th className="px-5 py-3">MUAC</th>
                <th className="px-5 py-3">Nutrition</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 text-gray-700">
                    {format(r.date, "dd MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {r.weightKg ? `${r.weightKg} kg` : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {r.heightCm ? `${r.heightCm} cm` : "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    {r.muacCm ? `${r.muacCm} cm` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {r.nutritionStatus ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${NUTRITION_COLORS[r.nutritionStatus]}`}
                      >
                        {NUTRITION_LABELS[r.nutritionStatus]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
