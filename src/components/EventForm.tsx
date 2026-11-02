"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INTERVAL_UNITS, toSeconds, type IntervalUnit } from "@/lib/interval";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export default function EventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState<IntervalUnit>("minutes");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const intervalSeconds = toSeconds(intervalValue, intervalUnit);

    startTransition(async () => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, intervalSeconds }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setNotice(
        `Event created. Sent to launcher-console now, and again every ${intervalValue} ${intervalUnit} while active.`
      );
      setTitle("");
      setDescription("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900">New event</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Publishes to launcher-console&apos;s in-app feed immediately, then repeats on the schedule below.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={150}
            placeholder="e.g. Quarterly review reminder"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={1000}
            rows={3}
            placeholder="What should the notification say?"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Repeat every</label>
          <div className="mt-1 flex gap-2">
            <input
              type="number"
              min={1}
              value={intervalValue}
              onChange={(e) => setIntervalValue(Math.max(1, Number(e.target.value) || 1))}
              required
              className={`${inputClass} mt-0 w-24`}
            />
            <select
              value={intervalUnit}
              onChange={(e) => setIntervalUnit(e.target.value as IntervalUnit)}
              className={`${inputClass} mt-0`}
            >
              {INTERVAL_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-400">Minimum 10 seconds.</p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

      <div className="mt-5">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create event"}
        </button>
      </div>
    </form>
  );
}
