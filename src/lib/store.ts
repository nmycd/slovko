"use client";

// A tiny observable value for useSyncExternalStore. `load` runs lazily on the
// first read (so prerendering never touches localStorage), `save` on every set.

export type Listener = () => void;

export function createStore<T>(initial: T, load?: () => T, save?: (value: T) => void) {
  let value = initial;
  let loaded = !load;
  const listeners = new Set<Listener>();
  const ensureLoaded = () => {
    if (!loaded) {
      loaded = true;
      value = load!();
    }
  };
  return {
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    get(): T {
      ensureLoaded();
      return value;
    },
    set(update: T | ((prev: T) => T)) {
      ensureLoaded();
      value = typeof update === "function" ? (update as (prev: T) => T)(value) : update;
      save?.(value);
      listeners.forEach((l) => l());
    },
  };
}
