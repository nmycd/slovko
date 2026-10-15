"use client";

import { useApp } from "@/components/app-provider";
import { localeNames, locales, type Locale } from "@/lib/i18n";

/** Compact language dropdown (footer, profile). */
export function LanguageSelect({ id, className = "" }: { id?: string; className?: string }) {
  const { locale, setLocale } = useApp();
  return (
    <select
      id={id}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={`rounded-xl border-[1.5px] border-border-strong bg-bg px-3 py-2 font-medium outline-none focus:border-accent ${className}`}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}

/** Large choice cards, used at sign-up. */
export function LanguageCards({ value, onChange }: { value: Locale; onChange: (l: Locale) => void }) {
  return (
    <div role="radiogroup" className="grid grid-cols-3 gap-2">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={value === l}
          onClick={() => onChange(l)}
          data-state={value === l ? "selected" : undefined}
          className="tile px-2 py-3 text-sm sm:text-base"
        >
          {localeNames[l]}
        </button>
      ))}
    </div>
  );
}
