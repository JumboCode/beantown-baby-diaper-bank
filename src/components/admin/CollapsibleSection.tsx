"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export type CollapsibleSectionProps = {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  titleClassName?: string;
  className?: string;
  defaultOpen?: boolean;
};

export function CollapsibleSection({
  title,
  right,
  children,
  titleClassName = "text-[18px] font-semibold",
  className = "",
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`w-full rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 p-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 cursor-pointer select-none items-center gap-2 text-left"
          aria-expanded={open}
        >
          <ChevronDown
            size={18}
            className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
            aria-hidden
          />
          <div className={`${titleClassName} text-gray-900`}>{title}</div>
        </button>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {open ? <div className="border-t border-gray-100 p-3">{children}</div> : null}
    </div>
  );
}
