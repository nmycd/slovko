"use client";

// Client state for the dictionary on /learn, shared by every search box:
// - the search text, kept for the browser tab (session storage), so a search survives
//   opening a result and switching tabs, and Return on a looked-up card can clear it;
// - the entries, fetched from /api/dictionary the first time someone searches.
// Stores rather than component state: Next keeps /learn alive (hidden) while a lesson
// is open, so component state wouldn't reset when Return clears the search.
import { useSyncExternalStore } from "react";
import type { DictionaryEntry } from "@/lib/dictionary";

const KEY = "slovko:dictionary-query";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let fallback = ""; // the search text when session storage is blocked

function readQuery(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return fallback;
  }
}

export function setDictionaryQuery(query: string) {
  fallback = query;
  try {
    sessionStorage.setItem(KEY, query);
  } catch {
    // Blocked: the fallback still holds it for this page.
  }
  notify();
}

export function useDictionaryQuery(): string {
  return useSyncExternalStore(subscribe, readQuery, () => "");
}

let entries: DictionaryEntry[] | null = null;
let loading: Promise<void> | null = null;

/** Starts fetching the entries (once; again after a failure). */
export function loadDictionary() {
  loading ??= fetch("/api/dictionary")
    .then((res) => (res.ok ? (res.json() as Promise<DictionaryEntry[]>) : Promise.reject(res.status)))
    .then((data) => {
      entries = data;
      notify();
    })
    .catch(() => {
      loading = null;
    });
}

/** The entries, or null until they've loaded. */
export function useDictionaryEntries(): DictionaryEntry[] | null {
  return useSyncExternalStore(subscribe, () => entries, () => null);
}
