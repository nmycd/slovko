"use client";

import { createStore } from "@/lib/store";
import { defaultLocale, detectLocale, isLocale, type Locale } from "./locales";

const STORAGE_KEY = "slovko:locale";

/** The language the learner picked on this device, if they ever picked one. */
export function savedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Current language: the learner's pick, else the browser's language. */
export const localeStore = createStore<Locale>(
  defaultLocale,
  () => savedLocale() ?? detectLocale(navigator.languages ?? [navigator.language]),
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    document.documentElement.lang = value;
  },
);
