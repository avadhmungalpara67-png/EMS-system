import { prisma } from "@/lib/prisma";

export async function generateEmployeeCode(): Promise<string> {
  const last = await prisma.employee.findFirst({
    orderBy: { createdAt: "desc" },
    select: { employeeCode: true },
  });

  const lastNumber = last ? parseInt(last.employeeCode.replace(/\D/g, ""), 10) || 0 : 0;
  const nextNumber = lastNumber + 1;
  return `EMP-${String(nextNumber).padStart(5, "0")}`;
}
