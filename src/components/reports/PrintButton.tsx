"use client";

import { PrinterIcon } from "@heroicons/react/24/outline";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
    >
      <PrinterIcon className="h-4 w-4" />
      Print report
    </button>
  );
}
