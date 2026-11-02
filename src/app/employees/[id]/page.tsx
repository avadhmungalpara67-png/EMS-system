import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageEmployees } from "@/lib/rbac";
import { StatusBadge, RoleBadge } from "@/components/badges";
import { ArrowRightIcon } from "@/components/icons";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default async function EmployeeDetailPage({
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

  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/employees"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" /> Back to employees
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {initials}
            </span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">
                {employee.firstName} {employee.lastName}
              </h1>
              <p className="text-sm text-slate-500">{employee.designation ?? "Not assigned yet"}</p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={employee.status} />
                <RoleBadge role={employee.user.role} />
              </div>
            </div>
          </div>
          <Link
            href={`/employees/${employee.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Edit
          </Link>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 pt-6 sm:grid-cols-2">
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Email" value={employee.email} />
          <Field label="Phone" value={employee.phone ?? ""} />
          <Field label="Department" value={employee.department ?? ""} />
          <Field label="Date of joining" value={employee.dateOfJoining.toDateString()} />
          <div className="sm:col-span-2">
            <Field label="Address" value={employee.address ?? ""} />
          </div>
        </dl>
      </div>
    </div>
  );
}
