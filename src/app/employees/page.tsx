import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma, type EmployeeStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteEmployees, canManageEmployees } from "@/lib/rbac";
import SearchFilterBar from "@/components/SearchFilterBar";
import Pagination from "@/components/Pagination";
import DeleteEmployeeButton from "@/components/DeleteEmployeeButton";
import PageHeader from "@/components/PageHeader";
import { StatusBadge, RoleBadge } from "@/components/badges";
import { PlusIcon, InboxIcon } from "@/components/icons";

const avatarPalette = [
  "bg-indigo-500",
  "bg-teal-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
];

function avatarColor(seed: string) {
  const code = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarPalette[code % avatarPalette.length];
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

type SearchParams = {
  q?: string;
  department?: string;
  status?: string;
  page?: string;
};

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const department = params.department?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = 10;
  const hasFilters = Boolean(q || department || status);

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

  const [total, employees, departmentRows] = await Promise.all([
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const departments = departmentRows.map((d) => d.department).filter((d): d is string => !!d);
  const canDelete = canDeleteEmployees(session.user.role);

  return (
    <div className="px-6 py-8 lg:px-10">
      <PageHeader
        title="Employees"
        subtitle={`${total} ${total === 1 ? "person" : "people"} in the directory`}
        action={
          <Link
            href="/employees/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <PlusIcon /> Add employee
          </Link>
        }
      />

      <SearchFilterBar departments={departments} />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department / Designation</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(emp.id)}`}
                      >
                        {initials(emp.firstName, emp.lastName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.employeeCode}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>{emp.department ?? "—"}</p>
                    <p className="text-xs text-slate-400">{emp.designation ?? "Not assigned yet"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={emp.user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600"
                      >
                        View
                      </Link>
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="text-sm font-medium text-slate-600 hover:text-indigo-600"
                      >
                        Edit
                      </Link>
                      {canDelete && (
                        <DeleteEmployeeButton id={emp.id} name={`${emp.firstName} ${emp.lastName}`} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <InboxIcon className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No employees found</p>
            <p className="text-sm text-slate-500">
              {hasFilters ? "Try adjusting your search or filters." : "Add your first employee to get started."}
            </p>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} searchParams={params} />
    </div>
  );
}
