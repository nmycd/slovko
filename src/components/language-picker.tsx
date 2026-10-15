"use client";

import { useApp } from "@/components/app-provider";
import { ChevronDownIcon } from "@/components/icons";
import { localeNames, locales, type Locale } from "@/lib/i18n";

/**
 * Language dropdown (footer, profile). `className` places it (margins, width);
 * `small` is the footer's size. Draws its own chevron: the browser's sits against
 * the border.
 */
export function LanguageSelect({
  id,
  className = "",
  small = false,
}: {
  id?: string;
  className?: string;
  small?: boolean;
}) {
  const { locale, setLocale } = useApp();
  return (
    <span className={`relative inline-block ${className}`}>
      <select
        id={id}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className={`w-full appearance-none rounded-xl border-[1.5px] border-border-strong bg-bg pr-9 pl-3 font-medium outline-none focus:border-accent ${
          small ? "py-1.5 text-sm" : "py-2"
        }`}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={small ? 14 : 16}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
      />
    </span>
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
