import { auth } from "@/lib/auth";
import { BellIcon } from "@heroicons/react/24/outline";

export default async function Header() {
  const session = await auth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <BellIcon className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-800 leading-none">
              {session?.user?.name}
            </p>
            <p className="text-gray-500 text-xs mt-0.5 capitalize">
              {session?.user?.role?.toLowerCase().replace("_", " ")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
