import type { Locale } from "@/lib/i18n";

/** "in 3 hours", "tomorrow", "in 12 days", in the learner's language. */
export function formatWhen(at: number, now: number, locale: Locale): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.max(1, Math.round((at - now) / 60_000));
  if (minutes < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}
