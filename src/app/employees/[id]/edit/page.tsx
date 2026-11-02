import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageEmployees } from "@/lib/rbac";
import EmployeeForm from "@/components/EmployeeForm";
import PageHeader from "@/components/PageHeader";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { role: true } } },
  });
  if (!employee) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title={`Edit ${employee.firstName} ${employee.lastName}`}
        subtitle={`Employee code ${employee.employeeCode}`}
      />
      <EmployeeForm
        employeeId={employee.id}
        canEditRole={session.user.role === "ADMIN"}
        initialValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone ?? "",
          department: employee.department ?? "",
          designation: employee.designation ?? "",
          dateOfJoining: employee.dateOfJoining.toISOString().slice(0, 10),
          status: employee.status,
          address: employee.address ?? "",
          role: employee.user.role,
        }}
      />
    </div>
  );
}
