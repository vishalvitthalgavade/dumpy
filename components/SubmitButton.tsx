"use client";

import { useFormStatus } from "react-dom";
import { MotionPress } from "@/components/MotionPrimitives";

export function SubmitButton({
  children,
  pendingLabel,
  className = "btn primary"
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <MotionPress>
      <button className={className} disabled={pending} type="submit">
        {pending ? <span className="button-skeleton" /> : null}
        {pending ? pendingLabel : children}
      </button>
    </MotionPress>
  );
}
