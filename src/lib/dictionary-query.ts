"use client";

// The dictionary's search text, kept for the browser tab (session storage) and shared
// by every search box, so a search survives opening a result and switching tabs, and
// Return on a looked-up card can clear it. A store rather than component state:
// Next keeps /learn alive (hidden) while a lesson is open, so its state wouldn't reset.
import { useSyncExternalStore } from "react";

const KEY = "slovko:dictionary-query";
const listeners = new Set<() => void>();
let fallback = ""; // when session storage is blocked

function read(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return fallback;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDictionaryQuery(query: string) {
  fallback = query;
  try {
    sessionStorage.setItem(KEY, query);
  } catch {
    // Blocked: the fallback still holds it for this page.
  }
  listeners.forEach((listener) => listener());
}

export function useDictionaryQuery(): string {
  return useSyncExternalStore(subscribe, read, () => "");
}
