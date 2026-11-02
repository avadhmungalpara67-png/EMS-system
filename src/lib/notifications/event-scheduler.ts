import { prisma } from "@/lib/prisma";
import { sendLauncherNotification } from "./inapp";

// Resolution the scheduler checks at — not a per-event interval. An event's
// own intervalSeconds (configurable from the UI) just has to be a multiple
// of this to fire on time; anything finer only adds load for no benefit.
const TICK_MS = 5_000;

let started = false;

function isDue(event: { lastSentAt: Date | null; intervalSeconds: number }, now: Date): boolean {
  if (!event.lastSentAt) return true;
  return now.getTime() - event.lastSentAt.getTime() >= event.intervalSeconds * 1000;
}

async function tick(): Promise<void> {
  try {
    const now = new Date();
    const events = await prisma.notificationEvent.findMany({ where: { isActive: true } });

    for (const event of events) {
      if (!isDue(event, now)) continue;

      await sendLauncherNotification({
        title: event.title,
        body: event.description,
        category: "admin.event",
        eventId: event.id,
      });

      // Stamped per event right after its own send, not batched at the end —
      // one slow/failed send must not delay or skip the due check for others.
      await prisma.notificationEvent.update({
        where: { id: event.id },
        data: { lastSentAt: new Date() },
      });
    }
  } catch (error) {
    console.error(
      "[notifications] event scheduler tick failed:",
      error instanceof Error ? error.message : error
    );
  }
}

/** Starts the shared ticker that drives every active NotificationEvent's repeat. */
export function startEventScheduler(): void {
  if (started) return;
  started = true;

  setInterval(tick, TICK_MS);
  console.log(`[notifications] event scheduler started (checking every ${TICK_MS / 1000}s)`);
}
