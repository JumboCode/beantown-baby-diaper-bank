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
  body?: unknown; // for POST
  headers?: Record<string, string>;
  /* Called to render the fetched data.*/
  render: (data: T) => React.ReactNode; // this is the actual fetched data
  /* Optional: transform raw json into T (e.g., unwrap {items: ...}).*/
  select?: (raw: unknown) => T;
  /**
   * Behavior:
   * - "onOpen" (default): fetch first time it opens
   * - "always": refetch on every open
   * - "never": you will call refetch manually (still supported)
   */
  fetchPolicy?: "onOpen" | "always" | "never";
  /* Optional: show a right-side summary, HOPE TO USE FOR EDIT BUTTON */
  right?: React.ReactNode;
  className?: string; // for styling
  defaultOpen?: boolean; 
};

export function CollapsibleDropdown<T>({
  title,
  endpoint,
  method = "GET",
  body,
  headers,
  render,
  select,
  fetchPolicy = "onOpen",
  right,
  className = "",
  defaultOpen = false, // false means the initial state of the dropdown is closed
}: CollapsibleDropdownProps<T>) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, setState] = useState<FetchState<T>>({
    status: "idle",
    data: null,
    error: null,
  });

  //////////////////////////////////////////////////////////////////////////////
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
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined, // sending to server
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed (${res.status})`);
      }

      const raw = (await res.json()) as unknown; // reading from server response
      const data = (select ? select(raw) : (raw as T)) as T;

      setState({ status: "success", data, error: null });
      hasFetchedOnceRef.current = true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setState({ status: "error", data: null, error: message });
    }
  };
////////////////////////////////////////////////////////////////////////////////


  useEffect(() => {
    if (!open) return;

    if (fetchPolicy === "never") return;

    if (fetchPolicy === "always") {
      void fetchData();
      return;
    }

    // onOpen
    if (!hasFetchedOnceRef.current) {
      void fetchData();
    }
  }, [open, fetchPolicy]); // intentionally not depending on endpoint/method/body to avoid accidental refetch loops
////////////////////////////////////////////////////////////////////////////////

  return (
    <div className={`w-full rounded-xl border border-gray-200 bg-white ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer select-none text-left"
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block transition-transform duration-150 ${
                open ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden
            >
              ▾
            </span>
            <div className="text-[18px] font-semibold text-gray-900">{title}</div>
          </div>

          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      </button>

      {/*  */}
      {open ? (
        <div className="border-t border-gray-100 p-4">
          {state.status === "idle" ? null : null}

          {state.status === "loading" ? (
            <div className="text-sm text-gray-600">Loading…</div>
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

          {/*  */}
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
