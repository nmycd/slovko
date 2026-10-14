"use client";

import { useApp } from "@/components/app-provider";
import { LanguageSelect } from "@/components/language-picker";

export function SiteFooter() {
  const { t } = useApp();
  return (
    <footer className="border-t-2 border-border">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <span className="font-bold">© Slovko</span>
        <label className="flex items-center gap-2">
          <span>{t("footer.language")}</span>
          <LanguageSelect className="py-1.5 text-sm" />
        </label>
      </div>
    </footer>
  );
}
