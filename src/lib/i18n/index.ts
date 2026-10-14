import { en, type MessageKey } from "./messages/en";
import { ru } from "./messages/ru";
import { uk } from "./messages/uk";
import type { Locale } from "./locales";

export * from "./locales";
export type { MessageKey } from "./messages/en";

const catalogs = { en, uk, ru };

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Translator for a locale; `{name}` placeholders are filled from `vars`. */
export function translator(locale: Locale): Translate {
  const messages = catalogs[locale];
  return (key, vars) => {
    const text: string = messages[key] ?? en[key];
    return vars ? text.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m)) : text;
  };
}
