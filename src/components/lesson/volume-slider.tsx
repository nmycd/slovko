"use client";

import { useSyncExternalStore } from "react";
import { useApp } from "@/components/app-provider";
import { SpeakerIcon } from "@/components/icons";
import { canSetVolume, setVolume, useVolume } from "@/lib/audio";

const never = () => () => {};

/**
 * The volume of the Slovak audio, for exercise screens' top bars. Absent where pages
 * can't set it (iPhones, iPads). `className` sets its display (e.g. "flex").
 */
export function VolumeSlider({ className = "" }: { className?: string }) {
  const { t } = useApp();
  const volume = useVolume();
  const settable = useSyncExternalStore(never, canSetVolume, () => false);
  if (!settable) return null;
  return (
    <label className={`items-center justify-end gap-1.5 text-muted ${className}`}>
      <SpeakerIcon size={16} />
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        onChange={(e) => setVolume(Number(e.target.value) / 100)}
        aria-label={t("lesson.volume")}
        className="w-14 cursor-pointer accent-brand sm:w-24"
      />
    </label>
  );
}
