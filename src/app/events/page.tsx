import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageNotificationEvents } from "@/lib/rbac";
import PageHeader from "@/components/PageHeader";
import EventForm from "@/components/EventForm";
import EventsList, { type EventRecord } from "@/components/EventsList";

export default async function EventsPage() {
  const session = await auth();
  if (!session || !canManageNotificationEvents(session.user.role)) {
    redirect("/dashboard");
  }

  const events = await prisma.notificationEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
  });

  // Serialized to the exact shape EventsList's own polling fetch (GET
  // /api/events, via NextResponse.json) returns, so initial render and
  // later polls never disagree on field types (Date -> ISO string).
  const initialEvents: EventRecord[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    isActive: event.isActive,
    intervalSeconds: event.intervalSeconds,
    lastSentAt: event.lastSentAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    createdBy: { email: event.createdBy.email },
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Events"
        subtitle="Recurring broadcasts sent to launcher-console's in-app feed."
      />

      <div className="mb-6">
        <EventForm />
      </div>

      <EventsList initialEvents={initialEvents} />
    </div>
  );
}
