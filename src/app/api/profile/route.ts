import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.update({
    where: { id: session.user.employeeId },
    data: {
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });

  return NextResponse.json({ employee });
}
