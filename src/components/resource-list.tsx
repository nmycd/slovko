"use client";

import { useApp } from "@/components/app-provider";
import { resourceGroups } from "@/lib/resources";

export function ResourceList() {
  const { t, locale } = useApp();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl">{t("resources.title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("resources.intro")}</p>
      {resourceGroups.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="text-xl">{t(group.title)}</h2>
          <ul className="mt-4 space-y-3">
            {group.items.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card block p-4 transition-colors hover:bg-surface"
                >
                  <span className="font-semibold text-brand">{item.name} ↗</span>
                  <span className="mt-1 block text-muted">{item.description[locale]}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
