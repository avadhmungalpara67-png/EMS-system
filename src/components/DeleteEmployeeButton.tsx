"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteEmployeeButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onDelete = () => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;

    startTransition(async () => {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete employee");
      }
    });
  };

  return (
    <button
      onClick={onDelete}
      disabled={isPending}
      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
