"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { LanguageSelect } from "@/components/language-picker";

export function SiteFooter() {
  const { t } = useApp();
  return (
    <footer className="border-t-2 border-border">
      {/* Copyright, contact link and language picker: left, centre and right on wider screens. */}
      <div className="mx-auto grid max-w-5xl items-center gap-3 px-4 py-6 text-sm text-muted sm:grid-cols-3">
        <span className="font-bold">© 2026 Slovko</span>
        <Link href="/contact" className="font-semibold text-brand hover:underline sm:justify-self-center">
          {t("footer.contact")}
        </Link>
        <label className="flex items-center gap-2 sm:justify-self-end">
          <span>{t("footer.language")}</span>
          <LanguageSelect small />
        </label>
      </div>
    </footer>
  );
}
