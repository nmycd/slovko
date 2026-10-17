"use client";

// The learner's review cards (FSRS state by card id, see ./items) and the deck
// they come from.
// Like lesson progress, cards live on the device; when signed in they're merged
// with the account's `review_cards` on login (the later review wins), and every
// change is written back, a few at a time.
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import type { Grade } from "ts-fsrs";
import { progressStore } from "@/lib/progress-store";
import { createStore } from "@/lib/store";
import { cardId, type ReviewItem } from "./items";
import { graded, moved, newCard, type StoredCard } from "./schedule";
import { recallReady } from "./session";

export type ReviewCards = Record<string, StoredCard>;
type ReviewState = { cards: ReviewCards };

const STORAGE_KEY = "slovko:reviews:v1";
const EMPTY: ReviewState = { cards: {} };

const reviewStore = createStore<ReviewState>(
  EMPTY,
  () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...EMPTY, ...JSON.parse(saved) } : EMPTY;
    } catch {
      return EMPTY;
    }
  },
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {}
  },
);

/** The cards as they are now, outside React. */
export const getReviewCards = (): ReviewCards => reviewStore.get().cards;

export function useReviewCards(): ReviewCards {
  return useSyncExternalStore(
    reviewStore.subscribe,
    () => reviewStore.get().cards,
    () => EMPTY.cards,
  );
}

// The deck, fetched once from /api/review-deck when something needs it.

let deckLoading: Promise<void> | null = null;
const deckStore = createStore<ReviewItem[] | null>(null);

export function loadReviewDeck() {
  deckLoading ??= fetch("/api/review-deck")
    .then((res) => (res.ok ? (res.json() as Promise<ReviewItem[]>) : Promise.reject(res.status)))
    .then((data) => {
      deckStore.set(data);
      addFinishedLessons();
    })
    .catch(() => {
      deckLoading = null;
    });
}

/** The deck, or null until it has loaded (call `loadReviewDeck` to start). */
export function useReviewDeck(): ReviewItem[] | null {
  return useSyncExternalStore(deckStore.subscribe, deckStore.get, () => null);
}

/** Items the learner has just met join the deck: a recognition card each, new and due now. */
export function markSeen(itemIds: string[], now = Date.now()) {
  addCards(itemIds.map((id) => cardId(id, "recognize")), now);
}

/** Recall cards for items now recognised well enough (see `recallReady`). Call before a session. */
export function addRecallCards(now = Date.now()) {
  addCards(recallReady(reviewStore.get().cards), now);
}

function addCards(ids: string[], now: number) {
  const added = ids.filter((id) => !reviewStore.get().cards[id]);
  if (!added.length) return;
  reviewStore.set((s) => ({
    ...s,
    cards: { ...s.cards, ...Object.fromEntries(added.map((id) => [id, newCard(now)])) },
  }));
  queuePush(added);
}

/** Schedules a card (by card id) after an answer. True if that really moved it (see `moved`). */
export function recordAnswer(id: string, rating: Grade, now = Date.now()): boolean {
  const before = reviewStore.get().cards[id] ?? newCard(now);
  const after = graded(before, rating, now);
  reviewStore.set((s) => ({ ...s, cards: { ...s.cards, [id]: after } }));
  queuePush([id]);
  return moved(before, after);
}

/**
 * Every finished lesson's cards are in the deck, including lessons finished before
 * reviews existed or on another device. Safe to repeat: known cards are kept.
 */
function addFinishedLessons() {
  const deck = deckStore.get();
  if (!deck) return;
  const completed = progressStore.get().completed;
  markSeen(deck.filter((item) => item.lessons.some((l) => completed[l])).map((item) => item.id));
}

// Account sync.

let account: { supabase: SupabaseClient; userId: string } | null = null;
const pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function queuePush(ids: string[]) {
  if (!account) return;
  ids.forEach((id) => pending.add(id));
  timer ??= setTimeout(() => void flush(), 1500);
}

async function flush() {
  if (timer) clearTimeout(timer);
  timer = null;
  if (!account || !pending.size) return;
  const { supabase, userId } = account;
  const cards = reviewStore.get().cards;
  const now = new Date().toISOString();
  const rows = [...pending]
    .filter((id) => cards[id])
    .map((id) => ({
      user_id: userId,
      item_id: id,
      card: cards[id],
      due: new Date(cards[id].due).toISOString(),
      last_review: cards[id].last_review ? new Date(cards[id].last_review).toISOString() : null,
      updated_at: now,
    }));
  pending.clear();
  if (!rows.length) return;
  const { error } = await supabase.from("review_cards").upsert(rows);
  if (error) console.error("Review sync failed:", error.message);
}

if (typeof window !== "undefined") window.addEventListener("pagehide", () => void flush());

/** Whether `a` is the more recent state of a card than `b`. */
const newer = (a: StoredCard, b: StoredCard) =>
  (a.last_review ?? 0) > (b.last_review ?? 0) || ((a.last_review ?? 0) === (b.last_review ?? 0) && a.reps > b.reps);

/** On sign-in: merges the account's cards with the device's and writes back what the account lacks. */
export async function connectReviewAccount(supabase: SupabaseClient, userId: string) {
  account = { supabase, userId };
  const { data, error } = await supabase.from("review_cards").select("item_id, card");
  if (error) {
    console.error("Loading reviews failed:", error.message);
    return;
  }
  const remote = new Map((data ?? []).map((r) => [r.item_id as string, r.card as StoredCard]));
  const local = reviewStore.get().cards;
  const merged: ReviewCards = { ...local };
  for (const [id, card] of remote) if (!merged[id] || newer(card, merged[id])) merged[id] = card;
  reviewStore.set((s) => ({ ...s, cards: merged }));
  queuePush(Object.keys(local).filter((id) => !remote.has(id) || newer(local[id], remote.get(id)!)));
  addFinishedLessons(); // the account's progress has just been merged in too
}

/** On sign-out: the device forgets the account's cards, as it does lesson progress. */
export function disconnectReviewAccount() {
  account = null;
  pending.clear();
  reviewStore.set(EMPTY);
}
