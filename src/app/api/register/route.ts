import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { generateEmployeeCode } from "@/lib/employee-code";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { firstName, lastName, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const employeeCode = await generateEmployeeCode();

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      role: "EMPLOYEE",
      employee: {
        create: {
          employeeCode,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone || null,
          dateOfJoining: new Date(),
          status: "PENDING",
        },
      },
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
