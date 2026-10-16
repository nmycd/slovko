"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useApp } from "@/components/app-provider";
import { SearchIcon } from "@/components/icons";
import { dictionarySearch, type DictionaryEntry } from "@/lib/dictionary";
import {
  loadDictionary,
  setDictionaryQuery,
  useDictionaryEntries,
  useDictionaryQuery,
} from "@/lib/dictionary-store";

/**
 * The dictionary card on /learn: search the words the course teaches; a result opens
 * the card that teaches it. The search text and the entries live in shared stores
 * (see dictionary-store); the entries load when the box is first used.
 */
export function Dictionary({ className = "" }: { className?: string }) {
  const { locale, authEnabled, authKnown, user, t } = useApp();
  const router = useRouter();
  const query = useDictionaryQuery();
  const entries = useDictionaryEntries();
  const search = useMemo(() => entries && dictionarySearch(entries, locale), [entries, locale]);
  const results = useMemo(() => search?.(query) ?? [], [search, query]);
  // A search remembered from earlier needs the entries straight away.
  useEffect(() => {
    if (query && !entries) loadDictionary();
  }, [query, entries]);
  // A result opens its intro card on its own (the lesson player's look-up); lessons
  // need an account, so signed-out visitors sign in first and come back.
  const signedOut = authEnabled && authKnown && !user;
  const hrefFor = (entry: DictionaryEntry) => {
    const card = `/lesson/${entry.lessonId}?card=${entry.card}`;
    return signedOut ? `/login?next=${encodeURIComponent(card)}` : card;
  };

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
          onChange={(e) => setDictionaryQuery(e.target.value)}
          onFocus={loadDictionary}
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
        entries &&
        (results.length ? (
          <ul className="mt-3 max-h-[50vh] space-y-0.5 overflow-y-auto">
            {results.map((entry) => (
              // Not the card alone: a grammar card has many entries (its examples, its pairs),
              // and keys that repeat leave stale rows behind as the results change.
              <li key={[entry.lessonId, entry.card, entry.kind, entry.sk, entry.meaning.en].join("|")}>
                <Link href={hrefFor(entry)} className="block rounded-xl px-3 py-2 transition-colors hover:bg-surface-2">
                  {/* A grammar card shows its title; a word, its Slovak and meaning. */}
                  <span className="block font-serif text-lg leading-snug">
                    {entry.kind === "grammar" ? entry.meaning[locale] : entry.sk}
                  </span>
                  <span className="block text-sm text-muted">
                    {entry.kind === "grammar" ? t("dictionary.grammar") : entry.meaning[locale]}
                  </span>
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
