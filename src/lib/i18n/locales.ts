// The learner's native language: it sets both the interface language and
// the language translations and explanations in the course are written in.

/** In the order they're offered to learners. */
export const locales = ["uk", "en", "ru", "uz", "ka"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Each language's name in itself. */
export const localeNames: Record<Locale, string> = {
  uk: "Українська",
  en: "English",
  ru: "Русский",
  uz: "Oʻzbekcha",
  ka: "ქართული",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

/** Best match for the browser's preferred languages. */
export function detectLocale(preferred: readonly string[]): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return defaultLocale;
}
