"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { canManageEmployees } from "@/lib/rbac";
import { GridIcon, UsersIcon, UserCircleIcon, ChevronsLeftIcon, LogoutIcon } from "@/components/icons";

type NavUser = {
  name?: string | null;
  email?: string | null;
  role: string;
};

function initialsOf(label: string) {
  const parts = label.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

const roleBadgeStyles: Record<string, string> = {
  ADMIN: "bg-indigo-500/15 text-indigo-300",
  HR: "bg-teal-500/15 text-teal-300",
  EMPLOYEE: "bg-slate-500/20 text-slate-300",
};

export default function Sidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const displayName = user.name ?? user.email ?? "User";

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: GridIcon },
    ...(canManageEmployees(user.role)
      ? [{ href: "/employees", label: "Employees", icon: UsersIcon }]
      : []),
    { href: "/profile", label: "My Profile", icon: UserCircleIcon },
  ];

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col bg-slate-900 text-slate-300 transition-[width] duration-200 ${
        collapsed ? "w-[76px]" : "w-64"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          U
        </span>
        {!collapsed && (
          <span className="truncate text-base font-semibold text-white">UMS</span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white ${
            collapsed ? "rotate-180" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeftIcon />
        </button>
      </div>

      <nav className="mt-2 flex-1 overflow-y-auto px-3">
        {!collapsed && (
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Main menu
          </p>
        )}
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={collapsed ? link.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className={`flex items-center gap-2.5 rounded-lg px-1 py-1.5 ${collapsed ? "justify-center" : ""}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
            {initialsOf(displayName)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <span
                className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleBadgeStyles[user.role] ?? roleBadgeStyles.EMPLOYEE}`}
              >
                {user.role}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}
