"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useApp } from "@/components/app-provider";
import { SearchIcon } from "@/components/icons";
import { dictionarySearch, type DictionaryEntry } from "@/lib/dictionary";

const STORAGE_KEY = "slovko:dictionary-query";

/** The last search, so it's still there back from a looked-up word. */
function savedQuery(): string {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return ""; // storage blocked: start empty
  }
}

/**
 * The dictionary card on /learn: search the words the course teaches; a result opens
 * its intro card. Client-only: mount it once the app is ready (it reads session storage).
 */
export function Dictionary({ entries, className = "" }: { entries: DictionaryEntry[]; className?: string }) {
  const { locale, authEnabled, authKnown, user, t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState(savedQuery);
  const search = useMemo(() => dictionarySearch(entries, locale), [entries, locale]);
  const results = useMemo(() => search(query), [search, query]);
  // A result opens its intro card on its own (the lesson player's look-up); lessons
  // need an account, so signed-out visitors sign in first and come back.
  const signedOut = authEnabled && authKnown && !user;
  const hrefFor = (entry: DictionaryEntry) => {
    const card = `/lesson/${entry.lessonId}?card=${entry.index}`;
    return signedOut ? `/login?next=${encodeURIComponent(card)}` : card;
  };

  function change(value: string) {
    setQuery(value);
    try {
      sessionStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Storage blocked: the search just won't be remembered.
    }
  }

  return (
    <div className={`card p-5 ${className}`}>
      <h2 className="text-lg">
        Slovník <span className="font-sans text-base font-normal text-muted">· {t("dictionary.title")}</span>
      </h2>
      <label className="mt-3 flex items-center gap-2 rounded-xl border-[1.5px] border-border-strong bg-bg px-3 focus-within:border-accent">
        <SearchIcon size={20} className="shrink-0 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) router.push(hrefFor(results[0]));
          }}
          placeholder={t("dictionary.placeholder")}
          aria-label={t("dictionary.title")}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent py-2.5 outline-none"
        />
      </label>
      {query.trim().length >= 2 &&
        (results.length ? (
          <ul className="mt-3 max-h-[50vh] space-y-0.5 overflow-y-auto">
            {results.map((entry) => (
              <li key={`${entry.lessonId}#${entry.index}`}>
                <Link href={hrefFor(entry)} className="block rounded-xl px-3 py-2 transition-colors hover:bg-surface-2">
                  <span className="block font-serif text-lg leading-snug">{entry.sk}</span>
                  <span className="block text-sm text-muted">{entry.meaning[locale]}</span>
                  <span className="block text-xs text-muted">
                    {t("lesson.place", { unit: entry.unit, lesson: entry.lesson })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">{t("dictionary.none")}</p>
        ))}
    </div>
  );
}
