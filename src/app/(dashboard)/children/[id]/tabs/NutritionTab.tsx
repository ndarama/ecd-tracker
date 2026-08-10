import { format } from "date-fns";
import { createNutritionScreening } from "@/actions/health";
import type { NutritionScreening } from "@/generated/prisma/client";

const BREASTFEEDING_LABELS = {
  EXCLUSIVE: "Exclusive breastfeeding",
  PARTIAL: "Partial breastfeeding",
  NOT_BREASTFED: "Not breastfed",
  NOT_APPLICABLE: "Not applicable",
};

export default function NutritionTab({
  childId,
  records,
}: {
  childId: string;
  records: NutritionScreening[];
}) {
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Nutrition Screening</h3>
        <form action={createNutritionScreening} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="hidden" name="childId" value={childId} />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Screening date <span className="text-red-500">*</span></label>
            <input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Breastfeeding status <span className="text-red-500">*</span></label>
            <select name="breastfeedingStatus" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select...</option>
              {Object.entries(BREASTFEEDING_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Meals and foods <span className="text-red-500">*</span></label>
            <textarea name="mealDescription" required rows={3} placeholder="Meals and foods eaten" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Feeding habits <span className="text-red-500">*</span></label>
            <textarea name="feedingHabits" required rows={3} placeholder="Frequency, appetite, feeding difficulties" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nutrition concerns</label>
            <textarea name="nutritionConcerns" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Recommended support</label>
            <textarea name="recommendedSupport" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input name="notes" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg">Save Screening</button>
          </div>
        </form>
      </div>

      {records.length > 0 && (
        <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50"><h3 className="font-semibold text-gray-700 text-sm">Screening History ({records.length})</h3></div>
          <div className="divide-y divide-gray-100">
            {records.map((record) => (
              <div key={record.id} className="px-5 py-4 space-y-1">
                <div className="flex justify-between gap-3"><span className="text-sm font-medium text-gray-800">{format(record.date, "dd MMM yyyy")}</span><span className="text-xs text-gray-500">{BREASTFEEDING_LABELS[record.breastfeedingStatus]}</span></div>
                <p className="text-sm text-gray-700"><strong>Meals:</strong> {record.mealDescription}</p>
                <p className="text-sm text-gray-700"><strong>Feeding:</strong> {record.feedingHabits}</p>
                {record.nutritionConcerns && <p className="text-sm text-amber-700"><strong>Concerns:</strong> {record.nutritionConcerns}</p>}
                {record.recommendedSupport && <p className="text-sm text-emerald-700"><strong>Support:</strong> {record.recommendedSupport}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
