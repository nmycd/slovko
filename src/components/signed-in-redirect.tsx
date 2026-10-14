"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/app-provider";

/**
 * Sends signed-in users elsewhere. The proxy already does this on full page
 * loads; this covers client-side navigation, which can skip the server.
 */
export function SignedInRedirect({ to }: { to: string }) {
  const router = useRouter();
  const { user } = useApp();
  useEffect(() => {
    if (user) router.replace(to);
  }, [user, router, to]);
  return null;
}
