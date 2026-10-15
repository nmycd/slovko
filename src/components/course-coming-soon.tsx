"use client";

import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { BookIcon } from "@/components/icons";
import type { MessageKey } from "@/lib/i18n";

/** Placeholder for a course that isn't written yet. */
export function CourseComingSoon({ title, body }: { title: MessageKey; body: MessageKey }) {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="flex items-center gap-2 text-sm font-semibold text-accent">
        <BookIcon size={18} /> {t("courses.comingSoon")}
      </p>
      <h1 className="mt-3 text-3xl">{t(title)}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{t(body)}</p>
      <Link href="/learn" className="btn mt-8">
        {t("courses.backToA1")}
      </Link>
    </div>
  );
}
