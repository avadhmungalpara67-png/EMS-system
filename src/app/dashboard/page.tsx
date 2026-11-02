import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageEmployees } from "@/lib/rbac";
import { UsersIcon, CheckBadgeIcon, ClockIcon, BuildingIcon, ArrowRightIcon, TrendUpIcon } from "@/components/icons";
import { StatusBadge } from "@/components/badges";
import PageHeader from "@/components/PageHeader";

type StatTone = "indigo" | "green" | "amber" | "slate";

const toneStyles: Record<StatTone, { bg: string; text: string }> = {
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

function StatCard({
  label,
  value,
  icon,
  tone = "slate",
  footnote,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: StatTone;
  footnote?: React.ReactNode;
}) {
  const style = toneStyles[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.bg} ${style.text}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {footnote && <div className="mt-1.5 text-xs">{footnote}</div>}
    </div>
  );
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

async function getMonthlyJoinStats() {
  const since = new Date();
  since.setMonth(since.getMonth() - 7);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<{ month: Date; status: string; count: bigint }[]>`
    SELECT date_trunc('month', "dateOfJoining") AS month, status, COUNT(*) AS count
    FROM "Employee"
    WHERE "dateOfJoining" >= ${since}
    GROUP BY 1, 2
    ORDER BY 1
  `;

  const buckets: { key: string; label: string; active: number; pending: number; other: number }[] = [];
  const cursor = new Date(since);
  for (let i = 0; i < 8; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    buckets.push({ key, label: MONTH_LABELS[cursor.getMonth()], active: 0, pending: 0, other: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  for (const row of rows) {
    const d = new Date(row.month);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) continue;
    const count = Number(row.count);
    if (row.status === "ACTIVE") bucket.active += count;
    else if (row.status === "PENDING") bucket.pending += count;
    else bucket.other += count;
  }

  return buckets;
}

function MonthlyJoinsChart({ data }: { data: Awaited<ReturnType<typeof getMonthlyJoinStats>> }) {
  const max = Math.max(1, ...data.map((d) => d.active + d.pending + d.other));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">New joiners by month</h2>
      </div>
      <p className="mb-6 text-xs text-slate-500">Based on each employee&apos;s date of joining, last 8 months.</p>

      <div className="mb-4 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-600" /> Active
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-200" /> Pending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-200" /> Other
        </span>
      </div>

      <div className="flex h-48 items-end gap-3">
        {data.map((d) => {
          const total = d.active + d.pending + d.other;
          return (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full max-w-10 flex-col-reverse overflow-hidden rounded-md bg-slate-50">
                {total === 0 ? null : (
                  <>
                    <div
                      className="w-full bg-indigo-600"
                      style={{ height: `${(d.active / max) * 100}%` }}
                      title={`${d.active} active`}
                    />
                    <div
                      className="w-full bg-indigo-200"
                      style={{ height: `${(d.pending / max) * 100}%` }}
                      title={`${d.pending} pending`}
                    />
                    <div
                      className="w-full bg-slate-300"
                      style={{ height: `${(d.other / max) * 100}%` }}
                      title={`${d.other} other`}
                    />
                  </>
                )}
              </div>
              <span className="text-xs text-slate-500">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentPanel({
  departments,
}: {
  departments: { department: string | null; _count: { _all: number } }[];
}) {
  const maxCount = Math.max(1, ...departments.map((d) => d._count._all));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <BuildingIcon className="h-5 w-5 text-slate-400" />
        <h2 className="text-base font-semibold text-slate-900">Headcount by department</h2>
      </div>
      {departments.length === 0 ? (
        <p className="text-sm text-slate-500">No department data yet.</p>
      ) : (
        <div className="space-y-3">
          {departments.map((d) => (
            <div key={d.department} className="flex items-center gap-4">
              <span className="w-28 shrink-0 truncate text-sm text-slate-700">{d.department}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.max(6, (d._count._all / maxCount) * 100)}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-sm font-medium text-slate-900">
                {d._count._all}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const avatarPalette = ["bg-indigo-500", "bg-teal-500", "bg-amber-500", "bg-rose-500", "bg-sky-500", "bg-violet-500"];
function avatarColor(seed: string) {
  const code = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return avatarPalette[code % avatarPalette.length];
}

async function AdminDashboard() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, active, pending, newLast30, departments, monthly, recent] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.employee.count({ where: { status: "PENDING" } }),
    prisma.employee.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.employee.groupBy({
      by: ["department"],
      _count: { _all: true },
      where: { department: { not: null } },
      orderBy: { _count: { department: "desc" } },
    }),
    getMonthlyJoinStats(),
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { role: true } } },
    }),
  ]);

  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div className="px-6 py-8 lg:px-10">
      <PageHeader
        title="Dashboard"
        subtitle="See how your workforce is doing at a glance."
        action={
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Manage employees
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total employees"
          value={total}
          icon={<UsersIcon />}
          tone="indigo"
          footnote={
            newLast30 > 0 ? (
              <span className="flex items-center gap-1 font-medium text-green-600">
                <TrendUpIcon /> {newLast30} new in last 30 days
              </span>
            ) : (
              <span className="text-slate-400">No new hires in last 30 days</span>
            )
          }
        />
        <StatCard
          label="Active"
          value={active}
          icon={<CheckBadgeIcon />}
          tone="green"
          footnote={<span className="text-slate-400">{activePct}% of total workforce</span>}
        />
        <StatCard
          label="Pending approval"
          value={pending}
          icon={<ClockIcon />}
          tone="amber"
          footnote={<span className="text-slate-400">Awaiting HR review</span>}
        />
      </div>

      {pending > 0 && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ClockIcon className="h-5 w-5 shrink-0" />
          <p>
            {pending} new registration{pending === 1 ? "" : "s"} waiting for review.{" "}
            <Link href="/employees?status=PENDING" className="font-semibold underline underline-offset-2">
              Review now
            </Link>
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyJoinsChart data={monthly} />
        </div>
        <DepartmentPanel departments={departments} />
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recently added</h2>
          <Link href="/employees" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View all <ArrowRightIcon />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recent.length === 0 && (
            <p className="px-6 py-8 text-center text-sm text-slate-500">No employees yet.</p>
          )}
          {recent.map((emp) => (
            <Link
              key={emp.id}
              href={`/employees/${emp.id}`}
              className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-slate-50"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(emp.id)}`}
              >
                {emp.firstName[0]}
                {emp.lastName[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {emp.firstName} {emp.lastName}
                </p>
                <p className="truncate text-xs text-slate-500">{emp.department ?? "Not assigned yet"}</p>
              </div>
              <StatusBadge status={emp.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

async function EmployeeDashboard({ employeeId }: { employeeId: string }) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    return (
      <div className="px-6 py-8 lg:px-10">
        <p className="text-sm text-slate-500">Your employee profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 lg:px-10">
      <PageHeader
        title={`Welcome, ${employee.firstName}`}
        subtitle="Here's a quick look at your employment details."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Employee code" value={employee.employeeCode} icon={<UsersIcon />} tone="indigo" />
        <StatCard label="Status" value={employee.status} icon={<CheckBadgeIcon />} tone="green" />
        <StatCard
          label="Department"
          value={employee.department ?? "Not assigned yet"}
          icon={<BuildingIcon />}
          tone="slate"
        />
      </div>

      {employee.status === "PENDING" && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <ClockIcon className="h-5 w-5 shrink-0" />
          <p>Your profile is pending HR review. You&apos;ll be assigned a department and designation soon.</p>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/profile"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View full profile <ArrowRightIcon />
        </Link>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  if (canManageEmployees(session.user.role)) {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard employeeId={session.user.employeeId ?? ""} />;
}
