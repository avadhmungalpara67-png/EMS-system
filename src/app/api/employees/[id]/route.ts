import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { canDeleteEmployees, canManageEmployees } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { role: true } } },
  });
  if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnRecord = session.user.employeeId === employee.id;
  if (!canManageEmployees(session.user.role) && !isOwnRecord) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ employee });
}

export async function PUT(request: Request, { params }: Params) {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const target = await prisma.employee.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isSelf = target.userId === session.user.id;

  if (isSelf && data.role && data.role !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot remove your own admin role" },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      department: data.department || null,
      designation: data.designation || null,
      dateOfJoining: new Date(data.dateOfJoining),
      status: data.status,
      address: data.address || null,
      // Only an ADMIN can change roles; HR managing employees never touches this.
      ...(isAdmin && data.role ? { user: { update: { role: data.role } } } : {}),
    },
    include: { user: { select: { role: true } } },
  });

  return NextResponse.json({ employee });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session || !canDeleteEmployees(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.employee.findUnique({ where: { id }, select: { userId: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (target.userId === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  await prisma.employee.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
