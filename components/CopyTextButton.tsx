"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/Icons";

export function CopyTextButton({
  className = "icon-btn",
  content,
  label = "Copy text",
  showLabel = false
}: {
  className?: string;
  content: string;
  label?: string;
  showLabel?: boolean;
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
      className={copied ? `${className} copied` : className}
      onClick={copyText}
      title={copied ? "Copied" : label}
      type="button"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span className={showLabel ? undefined : "sr-only"}>
        {copied ? "Copied" : label}
      </span>
    </button>
  );
}
