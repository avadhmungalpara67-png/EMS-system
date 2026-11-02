"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BulbIcon, InboxIcon } from "@/components/icons";
import { INTERVAL_UNITS, toSeconds, fromSeconds, formatInterval, type IntervalUnit } from "@/lib/interval";

const noopSubscribe = () => () => {};

/** True only once hydrated client-side — avoids an SSR/client text mismatch. */
function useHasMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  isActive: boolean;
  intervalSeconds: number;
  lastSentAt: string | null;
  createdAt: string;
  createdBy: { email: string };
};

const POLL_MS = 3000;
const FLASH_MS = 1500;

const inputClass =
  "rounded-lg border border-slate-300 px-2 py-1 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export default function EventsList({ initialEvents }: { initialEvents: EventRecord[] }) {
  const [events, setEvents] = useState<EventRecord[]>(initialEvents);
  const [flashing, setFlashing] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(1);
  const [editUnit, setEditUnit] = useState<IntervalUnit>("minutes");
  // "Last sent Xs ago" and toLocaleString() are both wall-clock/locale
  // dependent — computing them during the SSR pass and again at hydration
  // (even a few ms apart) mismatches. Only render them once mounted.
  const mounted = useHasMounted();
  const lastSentRef = useRef<Record<string, string | null>>(
    Object.fromEntries(initialEvents.map((e) => [e.id, e.lastSentAt]))
  );

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/events", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const fresh: EventRecord[] = data.events ?? [];

        for (const event of fresh) {
          const prev = lastSentRef.current[event.id];
          if (event.lastSentAt && event.lastSentAt !== prev) {
            setFlashing((f) => ({ ...f, [event.id]: true }));
            setTimeout(() => setFlashing((f) => ({ ...f, [event.id]: false })), FLASH_MS);
          }
          lastSentRef.current[event.id] = event.lastSentAt;
        }

        setEvents(fresh);
      } catch {
        // Silent — a missed poll just means the next one tries again.
      }
    };

    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const toggleActive = async (event: EventRecord) => {
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !event.isActive }),
    });
    if (!res.ok) {
      alert("Failed to update event");
      return;
    }
    const data = await res.json();
    lastSentRef.current[event.id] = data.event.lastSentAt;
    setEvents((evs) => evs.map((e) => (e.id === event.id ? data.event : e)));
  };

  const remove = async (event: EventRecord) => {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete event");
      return;
    }
    setEvents((evs) => evs.filter((e) => e.id !== event.id));
  };

  const startEditing = (event: EventRecord) => {
    const { value, unit } = fromSeconds(event.intervalSeconds);
    setEditingId(event.id);
    setEditValue(value);
    setEditUnit(unit);
  };

  const saveInterval = async (event: EventRecord) => {
    const intervalSeconds = toSeconds(editValue, editUnit);
    const res = await fetch(`/api/events/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalSeconds }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to update interval");
      return;
    }
    const data = await res.json();
    setEvents((evs) => evs.map((e) => (e.id === event.id ? data.event : e)));
    setEditingId(null);
  };

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-slate-400">
          <InboxIcon className="h-8 w-8" />
          <p className="text-sm">No events yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <ul className="divide-y divide-slate-100">
        {events.map((event) => (
          <li key={event.id} className="flex items-start justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 gap-3">
              <BulbIcon
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  flashing[event.id]
                    ? "animate-bulb-flash text-amber-500"
                    : event.isActive
                      ? "text-indigo-300"
                      : "text-slate-300"
                }`}
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {event.isActive ? `Active — ${formatInterval(event.intervalSeconds)}` : "Paused"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Created by {event.createdBy.email}
                  {mounted && (
                    <>
                      {" "}
                      · {new Date(event.createdAt).toLocaleString()} · Last sent {timeAgo(event.lastSentAt)}
                    </>
                  )}
                </p>

                {editingId === event.id ? (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={editValue}
                      onChange={(e) => setEditValue(Math.max(1, Number(e.target.value) || 1))}
                      className={`${inputClass} w-20`}
                    />
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value as IntervalUnit)}
                      className={inputClass}
                    >
                      {INTERVAL_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => saveInterval(event)}
                      className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditing(event)}
                    className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Change schedule
                  </button>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggleActive(event)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  event.isActive
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {event.isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => remove(event)}
                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
