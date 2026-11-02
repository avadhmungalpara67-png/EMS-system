import TopBarSearch from "@/components/TopBarSearch";
import { canManageEmployees } from "@/lib/rbac";

export default function TopBar({ role }: { role: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
      {canManageEmployees(role) ? (
        <TopBarSearch />
      ) : (
        <span className="text-sm text-slate-400">Company management portal</span>
      )}
    </header>
  );
}
