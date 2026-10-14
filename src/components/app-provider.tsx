"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { defaultLocale, isLocale, translator, type Locale, type Translate } from "@/lib/i18n";
import { localeStore, savedLocale } from "@/lib/i18n/locale-store";
import {
  EMPTY_PROGRESS,
  clockStore,
  dayOf,
  liveStreak,
  progressStore,
  withCompletedLesson,
  type Progress,
} from "@/lib/progress-store";
import { getSupabaseBrowser } from "@/lib/supabase/client";

// Learner state (XP, streak, completed lessons, native language) lives on
// the device so guests can play right away. When signed in, it is merged with
// the account on login, and every change is written to Supabase.

type Profile = { is_premium: boolean; display_name: string | null };

type AppState = {
  /** False during prerender and hydration; true once device state is available. */
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  isPremium: boolean;
  authEnabled: boolean;
  /** True once we know whether someone is signed in (always true without auth). */
  authKnown: boolean;
  progress: Progress;
  streak: number;
  todayXp: number;
  /** The learner's native language: interface and course translations. */
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translates an interface string into `locale`. */
  t: Translate;
  completeLesson: (lessonId: string, score: number, xp: number) => void;
  /** Re-reads the profile, e.g. after a payment (the Stripe webhook updates it). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

const noopSubscribe = () => () => {};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowser();
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const progress = useSyncExternalStore(progressStore.subscribe, progressStore.get, () => EMPTY_PROGRESS);
  const now = useSyncExternalStore(clockStore.subscribe, clockStore.get, () => 0);
  const locale = useSyncExternalStore(localeStore.subscribe, localeStore.get, () => defaultLocale);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Track the auth session; on sign-in, merge device and account progress.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setSessionChecked(true);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        progressStore.set(EMPTY_PROGRESS);
      }
      if (session?.user && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        const userId = session.user.id;
        // Deferred: Supabase calls inside this callback can deadlock the auth lock.
        setTimeout(async () => {
          const profile = await mergeAccountProgress(supabase, userId);
          // Fall back to a free profile so nothing waits forever if the row is missing.
          setProfile(profile ?? { is_premium: false, display_name: null });
          await syncLocale(supabase, userId, profile?.native_language);
        }, 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const isPremium = profile?.is_premium ?? false;

  const value: AppState = {
    ready,
    user,
    profile,
    isPremium,
    authEnabled: Boolean(supabase),
    authKnown: !supabase || sessionChecked,
    progress,
    locale,
    setLocale(next) {
      localeStore.set(next);
      if (supabase && user) {
        void supabase
          .from("profiles")
          .update({ native_language: next })
          .eq("id", user.id)
          .then(({ error }) => error && console.error("Saving language failed:", error.message));
      }
    },
    t: translator(locale),
    streak: liveStreak(progress, now),
    todayXp: progress.dailyXp.day === dayOf(now) ? progress.dailyXp.xp : 0,
    completeLesson(lessonId, score, xp) {
      clockStore.tick();
      progressStore.set((p) => withCompletedLesson(p, lessonId, score, xp, Date.now()));
      if (supabase && user) void pushProgress(supabase, user.id, progressStore.get(), [lessonId]);
    },
    async refreshProfile() {
      if (!supabase || !user) return;
      const { data } = await supabase
        .from("profiles")
        .select("is_premium, display_name")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    },
    async signOut() {
      await supabase?.auth.signOut();
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * The account's language wins once it has one; a new account (e.g. Google
 * sign-up, which skips our sign-up form) takes the language picked on this device.
 */
async function syncLocale(supabase: SupabaseClient, userId: string, accountLocale: unknown) {
  if (isLocale(accountLocale)) {
    if (accountLocale !== localeStore.get()) localeStore.set(accountLocale);
    return;
  }
  const local = savedLocale() ?? localeStore.get();
  const { error } = await supabase.from("profiles").update({ native_language: local }).eq("id", userId);
  if (error) console.error("Saving language failed:", error.message);
}

/** Loads the account's progress, merges it into the device's, and writes the result back. */
async function mergeAccountProgress(
  supabase: SupabaseClient,
  userId: string,
): Promise<(Profile & { native_language: string | null }) | null> {
  const [{ data: remote }, { data: rows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, xp, streak_count, streak_last_day, daily_goal, is_premium, native_language")
      .eq("id", userId)
      .single(),
    supabase.from("lesson_progress").select("lesson_id, best_score, times_completed"),
  ]);
  if (!remote) return null;

  progressStore.set((local) => {
    const completed = { ...local.completed };
    for (const r of rows ?? []) {
      const mine = completed[r.lesson_id];
      completed[r.lesson_id] = {
        best: Math.max(mine?.best ?? 0, r.best_score),
        count: Math.max(mine?.count ?? 0, r.times_completed),
      };
    }
    const remoteNewer = (remote.streak_last_day ?? "") >= (local.streakLastDay ?? "");
    return {
      ...local,
      xp: Math.max(local.xp, remote.xp),
      streak: remoteNewer ? remote.streak_count : local.streak,
      streakLastDay: remoteNewer ? remote.streak_last_day : local.streakLastDay,
      dailyGoal: remote.daily_goal ?? local.dailyGoal,
      completed,
    };
  });
  const merged = progressStore.get();
  await pushProgress(supabase, userId, merged, Object.keys(merged.completed));
  return {
    is_premium: remote.is_premium,
    display_name: remote.display_name,
    native_language: remote.native_language,
  };
}

async function pushProgress(supabase: SupabaseClient, userId: string, p: Progress, lessonIds: string[]) {
  const now = new Date().toISOString();
  const results = await Promise.all([
    supabase
      .from("profiles")
      .update({ xp: p.xp, streak_count: p.streak, streak_last_day: p.streakLastDay, updated_at: now })
      .eq("id", userId),
    lessonIds.length
      ? supabase.from("lesson_progress").upsert(
          lessonIds.map((id) => ({
            user_id: userId,
            lesson_id: id,
            best_score: p.completed[id].best,
            times_completed: p.completed[id].count,
            last_completed_at: now,
          })),
        )
      : Promise.resolve({ error: null }),
  ]);
  for (const r of results) if (r.error) console.error("Progress sync failed:", r.error.message);
}
