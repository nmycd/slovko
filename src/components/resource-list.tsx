"use client";

import { useApp } from "@/components/app-provider";
import type { MessageKey } from "@/lib/i18n";
import { levelSections, resourceGroups, type Level, type LevelItem } from "@/lib/resources";

const levelName: Record<Level, MessageKey> = {
  A1: "courses.a1",
  A2: "courses.a2",
  B1: "courses.b1",
  B2: "courses.b2",
};

export function ResourceList() {
  const { t, locale } = useApp();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl">{t("resources.title")}</h1>
      <p className="mt-3 text-lg text-muted">{t("resources.intro")}</p>

      {levelSections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl">{t(section.title)}</h2>
          {section.note && <p className="mt-2 text-sm text-muted">{t(section.note)}</p>}
          {section.levels.map(({ level, items }) => (
            <div key={level} className="mt-6">
              <h3 className="flex items-baseline gap-2 text-sm font-semibold text-brand">
                {level} <span className="font-normal text-muted">{t(levelName[level])}</span>
              </h3>
              <ul className="mt-3 space-y-3">
                {items.map((item) => (
                  <li key={item.title}>
                    <LevelCard item={item} note={item.note[locale]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}

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

/** A book or film: linked when there's a good place to find it. */
function LevelCard({ item, note }: { item: LevelItem; note: string }) {
  const body = (
    <>
      <span className="font-serif text-lg font-medium text-text">
        {item.title}
        {item.url && <span className="text-brand"> ↗</span>}
      </span>
      <span className="block text-sm text-muted">{item.by}</span>
      <span className="mt-1 block text-muted">{note}</span>
    </>
  );
  return item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card block p-4 transition-colors hover:bg-surface"
    >
      {body}
    </a>
  ) : (
    <div className="card p-4">{body}</div>
  );
}
