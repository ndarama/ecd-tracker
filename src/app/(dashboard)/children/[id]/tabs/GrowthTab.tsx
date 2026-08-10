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

      {records.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GrowthChart
            title="Weight trend"
            unit="kg"
            color="#059669"
            points={records
              .filter((record) => record.weightKg !== null)
              .map((record) => ({ date: record.date, value: record.weightKg! }))}
          />
          <GrowthChart
            title="Height trend"
            unit="cm"
            color="#2563eb"
            points={records
              .filter((record) => record.heightCm !== null)
              .map((record) => ({ date: record.date, value: record.heightCm! }))}
          />
        </div>
      )}

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

function GrowthChart({
  title,
  unit,
  color,
  points,
}: {
  title: string;
  unit: string;
  color: string;
  points: Array<{ date: Date; value: number }>;
}) {
  if (points.length < 2) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="mt-3 text-sm text-gray-400">Add at least two measurements to see a trend.</p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 34, left: 46 };
  const values = points.map((point) => point.value);
  const minimum = Math.max(0, Math.min(...values) * 0.9);
  const maximum = Math.max(...values) * 1.1 || 1;
  const x = (index: number) => padding.left + (index / (points.length - 1)) * (width - padding.left - padding.right);
  const y = (value: number) => padding.top + ((maximum - value) / (maximum - minimum)) * (height - padding.top - padding.bottom);
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index)} ${y(point.value)}`).join(" ");

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[480px]" role="img" aria-label={`${title} chart`}>
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#d1d5db" />
          <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#d1d5db" />
          <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => (
            <g key={`${point.date.toISOString()}-${index}`}>
              <circle cx={x(index)} cy={y(point.value)} r="4" fill={color} />
              <text x={x(index)} y={height - 12} textAnchor="middle" fontSize="10" fill="#6b7280">{format(point.date, "dd MMM")}</text>
            </g>
          ))}
          <text x="8" y={padding.top + 4} fontSize="10" fill="#6b7280">{maximum.toFixed(1)}</text>
          <text x="8" y={height - padding.bottom} fontSize="10" fill="#6b7280">{minimum.toFixed(1)}</text>
        </svg>
      </div>
    </div>
  );
}
