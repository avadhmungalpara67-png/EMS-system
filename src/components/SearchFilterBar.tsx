"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchIcon } from "@/components/icons";

export default function SearchFilterBar({ departments }: { departments: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  const hasFilters = Boolean(
    searchParams.get("q") || searchParams.get("department") || searchParams.get("status"),
  );

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const clearAll = () => {
    setQ("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateParam("q", q);
      }}
      className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, or employee code"
          className="w-72 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>
      <select
        defaultValue={searchParams.get("department") ?? ""}
        onChange={(e) => updateParam("department", e.target.value)}
        className={selectClass}
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
        className={selectClass}
      >
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="TERMINATED">Terminated</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
      >
        Search
      </button>
      {hasFilters && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Clear filters
        </button>
      )}
    </form>
  );
}
