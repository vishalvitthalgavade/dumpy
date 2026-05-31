"use client";

import { useState } from "react";

export function CopyTextButton({
  className = "btn icon-btn",
  content,
  label = "Copy text"
}: {
  className?: string;
  content: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      aria-label={copied ? "Text copied" : label}
      className={className}
      onClick={copyText}
      title={copied ? "Copied" : label}
      type="button"
    >
      <span aria-hidden="true">{copied ? "✓" : "⧉"}</span>
      <span className="sr-only">{copied ? "Copied" : label}</span>
    </button>
  );
}
