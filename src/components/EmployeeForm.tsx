"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export type EmployeeFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  status: string;
  address: string;
  role: string;
};

const emptyValues: EmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  dateOfJoining: new Date().toISOString().slice(0, 10),
  status: "ACTIVE",
  address: "",
  role: "EMPLOYEE",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function EmployeeForm({
  employeeId,
  initialValues,
  canEditRole = false,
}: {
  employeeId?: string;
  initialValues?: Partial<EmployeeFormValues>;
  canEditRole?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeFormValues>({ ...emptyValues, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEdit = Boolean(employeeId);

  const update =
    (key: keyof EmployeeFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const res = await fetch(isEdit ? `/api/employees/${employeeId}` : "/api/employees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      if (!isEdit && data.temporaryPassword) {
        setNotice(`Employee created. Temporary password: ${data.temporaryPassword}`);
        setValues({ ...emptyValues });
        router.refresh();
        return;
      }

      router.push("/employees");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Personal information">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input value={values.firstName} onChange={update("firstName")} required className={inputClass} />
          </Field>
          <Field label="Last name">
            <input value={values.lastName} onChange={update("lastName")} required className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <input type="email" value={values.email} onChange={update("email")} required className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={values.phone} onChange={update("phone")} className={inputClass} />
          </Field>
        </div>
        <Field label="Address">
          <textarea value={values.address} onChange={update("address")} rows={2} className={inputClass} />
        </Field>
      </Section>

      <Section title="Employment details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Department">
            <input value={values.department} onChange={update("department")} className={inputClass} />
          </Field>
          <Field label="Designation">
            <input value={values.designation} onChange={update("designation")} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date of joining">
            <input
              type="date"
              value={values.dateOfJoining}
              onChange={update("dateOfJoining")}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Status">
            <select value={values.status} onChange={update("status")} className={inputClass}>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </Field>
        </div>
      </Section>

      {canEditRole && (
        <Section title="Access & role" description="Controls what this person can see and do after signing in.">
          <div className="sm:w-1/3">
            <Field label="Role">
              <select value={values.role} onChange={update("role")} className={inputClass}>
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
                <option value="ADMIN">Admin</option>
              </select>
            </Field>
          </div>
        </Section>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
        >
          {isPending ? "Saving..." : isEdit ? "Save changes" : "Create employee"}
        </button>
      </div>
    </form>
  );
}
