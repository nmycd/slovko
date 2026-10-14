"use client";

import { useApp } from "@/components/app-provider";

/**
 * Keeps prerendered text invisible until the learner's language is known
 * (it lives in localStorage), so English never flashes before Ukrainian or
 * Russian. Hydration takes a moment; the layout doesn't shift.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const { ready } = useApp();
  return <div className={`contents ${ready ? "" : "invisible"}`}>{children}</div>;
}
