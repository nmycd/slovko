"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/app-provider";
import { CrownIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { StatsBar } from "@/components/stats-bar";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, authEnabled, isPremium, premiumKnown, t } = useApp();
  const onLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-20 border-b-2 border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Logo href={user ? "/learn" : "/"} />
        <nav className="flex items-center gap-3 sm:gap-5">
          {!onLanding && (
            <div className="hidden sm:block">
              <StatsBar />
            </div>
          )}
          {premiumKnown && !isPremium && (
            <Link
              href="/pricing"
              className="hidden items-center gap-1 text-sm font-semibold text-gold sm:flex"
            >
              <CrownIcon size={18} /> {t("nav.premium")}
            </Link>
          )}
          {authEnabled &&
            (user ? (
              <Link
                href="/account"
                aria-label={t("nav.account")}
                className="grid size-10 place-items-center rounded-full bg-brand-soft font-semibold text-brand"
              >
                {(user.email ?? "?")[0].toUpperCase()}
              </Link>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-brand">
                {t("nav.signIn")}
              </Link>
            ))}
        </nav>
      </div>
      {!onLanding && (
        <div className="flex justify-center border-t-2 border-border py-2 sm:hidden">
          <StatsBar />
        </div>
      )}
    </header>
  );
}
