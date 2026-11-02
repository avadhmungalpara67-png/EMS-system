export const INTERVAL_UNITS = [
  { value: "seconds", label: "Seconds", multiplier: 1 },
  { value: "minutes", label: "Minutes", multiplier: 60 },
  { value: "hours", label: "Hours", multiplier: 3600 },
] as const;

export type IntervalUnit = (typeof INTERVAL_UNITS)[number]["value"];

export function toSeconds(value: number, unit: IntervalUnit): number {
  const def = INTERVAL_UNITS.find((u) => u.value === unit) ?? INTERVAL_UNITS[0];
  return Math.round(value * def.multiplier);
}

/** Picks the largest unit that divides evenly, for a clean default display. */
export function fromSeconds(totalSeconds: number): { value: number; unit: IntervalUnit } {
  for (const def of [...INTERVAL_UNITS].reverse()) {
    if (totalSeconds % def.multiplier === 0) {
      return { value: totalSeconds / def.multiplier, unit: def.value };
    }
  }
  return { value: totalSeconds, unit: "seconds" };
}

const UNIT_SUFFIX: Record<IntervalUnit, string> = { seconds: "s", minutes: "m", hours: "h" };

export function formatInterval(totalSeconds: number): string {
  const { value, unit } = fromSeconds(totalSeconds);
  return `every ${value}${UNIT_SUFFIX[unit]}`;
}
