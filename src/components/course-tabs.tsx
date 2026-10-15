"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useApp } from "@/components/app-provider";
import type { MessageKey } from "@/lib/i18n";

/** `level`: a CEFR code shown before the label (the label is then its standard name). */
type Tab = { href: string; label: MessageKey; level?: string; soon?: boolean };

const tabs: Tab[] = [
  { href: "/learn", level: "A1", label: "courses.a1" },
  { href: "/learn/a2", level: "A2", label: "courses.a2", soon: true },
  { href: "/learn/b1", level: "B1", label: "courses.b1", soon: true },
  { href: "/learn/driving", label: "courses.driving", soon: true },
  { href: "/learn/review", label: "courses.review" },
  { href: "/learn/resources", label: "courses.resources" },
];

/** Course switcher at the top of /learn. Scrolls sideways on narrow screens. */
export function CourseTabs() {
  const pathname = usePathname();
  const { t } = useApp();
  const list = useRef<HTMLUListElement>(null);

  // On a phone the current tab can sit past the right edge: bring it into view.
  useEffect(() => {
    const current = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (current && list.current) {
      list.current.scrollLeft = current.offsetLeft - list.current.clientWidth / 2 + current.offsetWidth / 2;
    }
  }, [pathname]);

  return (
    <nav aria-label={t("courses.label")} className="border-b border-border">
      <ul ref={list} className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href} className="shrink-0">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-baseline gap-1.5 border-b-2 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? "border-brand text-brand" : "border-transparent text-muted hover:text-text"
                }`}
              >
                {tab.level && <span>{tab.level}</span>}
                <span className={tab.level ? "font-normal" : undefined}>{t(tab.label)}</span>
                {tab.soon && <span className="text-xs font-normal text-muted">{t("courses.soon")}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
