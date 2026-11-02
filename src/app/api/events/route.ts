import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificationEventSchema } from "@/lib/validations";
import { canManageNotificationEvents } from "@/lib/rbac";
import { sendLauncherNotification } from "@/lib/notifications/inapp";

export async function GET() {
  const session = await auth();
  if (!session || !canManageNotificationEvents(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await prisma.notificationEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { email: true } } },
  });

  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !canManageNotificationEvents(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = notificationEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // The session is a stateless JWT — it can outlive the user row it points
  // to (e.g. a dev DB reset). Check before using session.user.id as a FK,
  // so that case is a clean re-login prompt instead of a 500.
  const creator = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!creator) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign out and sign in again." },
      { status: 401 },
    );
  }

  const now = new Date();
  const event = await prisma.notificationEvent.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      intervalSeconds: parsed.data.intervalSeconds,
      lastSentAt: now, // sent immediately below — scheduler's due check starts counting from here
      createdById: session.user.id,
    },
    include: { createdBy: { select: { email: true } } },
  });

  // Immediate feedback — the event-scheduler picks it up for the recurring
  // send (every intervalSeconds) from here on, while isActive stays true.
  await sendLauncherNotification({
    title: event.title,
    body: event.description,
    category: "admin.event",
    eventId: event.id,
  });

  return NextResponse.json({ event }, { status: 201 });
}
