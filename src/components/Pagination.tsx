import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export default function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") params.set(key, value);
    });
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  const baseBtn =
    "inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors";

  return (
    <div className="mt-4 flex items-center justify-between">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`${baseBtn} ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
      >
        <ChevronLeftIcon /> Previous
      </Link>
      <span className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of{" "}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`${baseBtn} ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
      >
        Next <ChevronRightIcon />
      </Link>
    </div>
  );
}
