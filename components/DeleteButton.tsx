"use client";

import { useFormStatus } from "react-dom";
import { TrashIcon } from "@/components/Icons";

export function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button aria-label={pending ? `Deleting ${label}` : `Delete ${label}`} className="icon-btn danger" disabled={pending} title={pending ? "Deleting..." : `Delete ${label}`} type="submit">
    {pending ? <span className="button-skeleton" /> : <TrashIcon />}
  </button>;
}
