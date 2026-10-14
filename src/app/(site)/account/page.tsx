import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account-panel";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      {/* AccountPanel reads ?checkout= from the URL, which is request-time data. */}
      <Suspense>
        <AccountPanel />
      </Suspense>
    </div>
  );
}
