"use client";

import React, { useEffect, useRef, useState } from "react";

type FetchState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: string };

export type CollapsibleDropdownProps<T> = {
  title: React.ReactNode;
  endpoint: string;
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  render: (data: T) => React.ReactNode;
  select?: (raw: unknown) => T;
  fetchPolicy?: "onOpen" | "always" | "never";
  right?: React.ReactNode;
  titleClassName?: string;
  className?: string;
  defaultOpen?: boolean;
};

export function CollapsibleDropdown<T>({
  title,  
  endpoint,  // api
  method = "GET",
  body,
  headers,
  render,   // data underneath dropdown (see DistributionsTable.tsx)
  select,
  fetchPolicy = "onOpen",
  right,  //needed for "edit" button
  titleClassName = "text-[18px] font-semibold", 
  className = "",
  defaultOpen = false,  //
}: CollapsibleDropdownProps<T>) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<FetchState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  // fetches data from api
  const hasFetchedOnceRef = useRef(false);
  const fetchData = async () => {
    setState({ status: "loading", data: null, error: null });
    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(headers ?? {}),
        },
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const raw = (await res.json()) as unknown;
      const data = (select ? select(raw) : (raw as T)) as T;

      setState({ status: "success", data, error: null });
      hasFetchedOnceRef.current = true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setState({ status: "error", data: null, error: message });
    }
  };

  // calls fetchData()
  useEffect(() => {
    if (!open) return;
    if (fetchPolicy === "never") return;

    if (fetchPolicy === "always") {
      void fetchData();
      return;
    }

    if (!hasFetchedOnceRef.current) {
      void fetchData();
    }
  }, [open, fetchPolicy]);

  // styling of dropdown (open and closed)
  return (
    <div className={`w-full rounded-xl border border-gray-200 bg-white ${className}`}>
      <div className="flex items-center justify-between gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 cursor-pointer select-none items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span
            className={`inline-block transition-transform duration-150 ${
              open ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden
          >
            ▼
          </span>
          <div className={`${titleClassName} text-gray-900`}>{title}</div>
        </button>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {open ? (
        <div className="border-t border-gray-100 p-4">
          {state.status === "loading" ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : null}

          {state.status === "error" ? (
            <div className="space-y-2">
              <div className="text-sm text-red-600">Error: {state.error}</div>
              <button
                type="button"
                onClick={() => void fetchData()}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          ) : null}

          {state.status === "success" ? (
            <div className="space-y-3">
              {render(state.data)}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void fetchData()}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
