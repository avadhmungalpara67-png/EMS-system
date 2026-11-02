import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageNotificationEvents } from "@/lib/rbac";
import { notificationEventUpdateSchema } from "@/lib/validations";
import { sendLauncherNotification } from "@/lib/notifications/inapp";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session || !canManageNotificationEvents(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = notificationEventUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await prisma.notificationEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resuming (false -> true) sends immediately, same as creation, so the
  // admin gets instant confirmation rather than waiting up to one interval.
  const isResuming = parsed.data.isActive === true && !existing.isActive;

  const event = await prisma.notificationEvent.update({
    where: { id },
    data: {
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.intervalSeconds !== undefined ? { intervalSeconds: parsed.data.intervalSeconds } : {}),
      ...(isResuming ? { lastSentAt: new Date() } : {}),
    },
    include: { createdBy: { select: { email: true } } },
  });

  if (isResuming) {
    await sendLauncherNotification({
      title: event.title,
      body: event.description,
      category: "admin.event",
      eventId: event.id,
    });
  }

  return NextResponse.json({ event });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session || !canManageNotificationEvents(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.notificationEvent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notificationEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
