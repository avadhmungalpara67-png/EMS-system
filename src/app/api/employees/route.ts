import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma, type EmployeeStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { canManageEmployees } from "@/lib/rbac";
import { generateEmployeeCode } from "@/lib/employee-code";

export async function GET(request: Request) {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const department = searchParams.get("department")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10) || 10));

  const where: Prisma.EmployeeWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { employeeCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      department ? { department: { equals: department, mode: "insensitive" } } : {},
      status ? { status: status as EmployeeStatus } : {},
    ],
  };

  const [total, employees, departments] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { role: true } } },
    }),
    prisma.employee.findMany({
      where: { department: { not: null } },
      select: { department: true },
      distinct: ["department"],
    }),
  ]);

  return NextResponse.json({
    employees,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    departments: departments.map((d) => d.department).filter(Boolean),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const employeeCode = await generateEmployeeCode();
  const temporaryPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Only an ADMIN may assign a role other than EMPLOYEE. HR can create
  // employee accounts but can never grant HR/ADMIN privileges.
  const assignedRole = session.user.role === "ADMIN" && data.role ? data.role : "EMPLOYEE";

  const employee = await prisma.employee.create({
    data: {
      employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: normalizedEmail,
      phone: data.phone || null,
      department: data.department || null,
      designation: data.designation || null,
      dateOfJoining: new Date(data.dateOfJoining),
      status: data.status,
      address: data.address || null,
      user: {
        create: {
          email: normalizedEmail,
          passwordHash,
          role: assignedRole,
        },
      },
    },
    include: { user: { select: { role: true } } },
  });

  return NextResponse.json({ employee, temporaryPassword }, { status: 201 });
}
