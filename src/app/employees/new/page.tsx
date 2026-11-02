import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canManageEmployees } from "@/lib/rbac";
import EmployeeForm from "@/components/EmployeeForm";
import PageHeader from "@/components/PageHeader";

export default async function NewEmployeePage() {
  const session = await auth();
  if (!session || !canManageEmployees(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Add employee" subtitle="Create a new employee profile and login." />
      <EmployeeForm canEditRole={session.user.role === "ADMIN"} />
    </div>
  );
}
