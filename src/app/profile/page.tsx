import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileEditForm from "@/components/ProfileEditForm";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/badges";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (!session.user.employeeId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-slate-500">No employee profile linked to this account.</p>
      </div>
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
  });

  if (!employee) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-slate-500">Employee profile not found.</p>
      </div>
    );
  }

  const initials = `${employee.firstName[0] ?? ""}${employee.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <PageHeader title="My profile" subtitle="Your employment details and contact info." />

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
            {initials}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-slate-500">{employee.designation ?? "Not assigned yet"}</p>
            <div className="mt-2">
              <StatusBadge status={employee.status} />
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 pt-6 sm:grid-cols-2">
          <Field label="Employee code" value={employee.employeeCode} />
          <Field label="Email" value={employee.email} />
          <Field label="Department" value={employee.department ?? "Not assigned yet"} />
          <Field label="Date of joining" value={employee.dateOfJoining.toDateString()} />
        </dl>
      </div>

      <ProfileEditForm initialPhone={employee.phone ?? ""} initialAddress={employee.address ?? ""} />
    </div>
  );
}
