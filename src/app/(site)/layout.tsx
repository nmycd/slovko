import { HydrationGate } from "@/components/hydration-gate";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <HydrationGate>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </HydrationGate>
  );
}
