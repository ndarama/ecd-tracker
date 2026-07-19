import { format } from "date-fns";
import { markImmunizationGiven, createImmunization } from "@/actions/health";
import type { Immunization } from "@/generated/prisma/client";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

const COMMON_VACCINES = [
  "BCG",
  "OPV-0",
  "OPV-1",
  "OPV-2",
  "OPV-3",
  "Penta-1",
  "Penta-2",
  "Penta-3",
  "PCV-1",
  "PCV-2",
  "PCV-3",
  "Rotavirus-1",
  "Rotavirus-2",
  "Measles-Rubella",
  "Vitamin A",
];

export default function ImmunizationsTab({
  childId,
  records,
}: {
  childId: string;
  records: Immunization[];
}) {
  const given = records.filter((r) => r.givenDate);
  const pending = records.filter((r) => !r.givenDate);

  return (
    <div className="space-y-5">
      {/* Add form */}
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Add Vaccine Record</h3>
        <form action={createImmunization} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <input type="hidden" name="childId" value={childId} />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Vaccine <span className="text-red-500">*</span>
            </label>
            <select
              name="vaccine"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select…</option>
              {COMMON_VACCINES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              name="dueDate"
              type="date"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Date Given
            </label>
            <input
              name="givenDate"
              type="date"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Batch Number
            </label>
            <input
              name="batchNumber"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Add Vaccine
            </button>
          </div>
        </form>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-amber-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
            <h3 className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Pending ({pending.length})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Vaccine</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-gray-800">{r.vaccine}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {format(r.dueDate, "dd MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{r.batchNumber ?? "—"}</td>
                  <td className="px-5 py-3">
                    <form action={markImmunizationGiven.bind(null, r.id, childId)}>
                      <button
                        type="submit"
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                      >
                        Mark Given
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Given */}
      {given.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-green-600" />
              Administered ({given.length})
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">Vaccine</th>
                <th className="px-5 py-3">Due</th>
                <th className="px-5 py-3">Given</th>
                <th className="px-5 py-3">Batch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {given.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3 font-medium text-gray-800">{r.vaccine}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {format(r.dueDate, "dd MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 text-green-700">
                    {format(r.givenDate!, "dd MMM yyyy")}
                  </td>
                  <td className="px-5 py-3 text-gray-500">{r.batchNumber ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {records.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No immunization records yet.</p>
      )}
    </div>
  );
}
