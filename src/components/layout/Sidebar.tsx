"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellIcon,
  ArrowRightStartOnRectangleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/children", label: "Children", icon: UsersIcon },
  { href: "/visits", label: "Home Visits", icon: ClipboardDocumentListIcon },
  { href: "/reports", label: "Reports", icon: ChartBarIcon },
  { href: "/notifications", label: "Notifications", icon: BellIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-emerald-800 text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-emerald-700">
        <span className="text-lg font-bold tracking-tight">ECD Tracker</span>
        <p className="text-xs text-emerald-300 mt-0.5">Community Health System</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-emerald-600 text-white"
                : "text-emerald-100 hover:bg-emerald-700 hover:text-white"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-emerald-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-100 hover:bg-emerald-700 hover:text-white transition-colors"
        >
          <ArrowRightStartOnRectangleIcon className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
