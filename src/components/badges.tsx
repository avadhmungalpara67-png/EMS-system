const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-slate-100 text-slate-700",
  TERMINATED: "bg-red-100 text-red-700",
};

const roleStyles: Record<string, string> = {
  ADMIN: "bg-indigo-50 text-indigo-700",
  HR: "bg-teal-50 text-teal-700",
  EMPLOYEE: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? statusStyles.INACTIVE}`}
    >
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${roleStyles[role] ?? roleStyles.EMPLOYEE}`}
    >
      {role}
    </span>
  );
}
