"use client";

import { useEffect } from "react";
import { SpeakerIcon, TurtleIcon } from "@/components/icons";
import { playSlovak, preloadSlovak } from "@/lib/audio";

export function AudioButton({
  text,
  autoPlay = false,
  size = "md",
  withSlow = false,
}: {
  text: string;
  autoPlay?: boolean;
  size?: "md" | "lg";
  withSlow?: boolean;
}) {
  useEffect(() => {
    preloadSlovak(text);
    if (autoPlay) void playSlovak(text);
  }, [text, autoPlay]);

  const big = size === "lg";
  return (
    <span className="inline-flex items-end gap-3">
      <button
        type="button"
        onClick={() => playSlovak(text)}
        aria-label={`Play “${text}”`}
        className={`btn shrink-0 !p-0 ${big ? "size-28 !rounded-3xl" : "size-12"}`}
      >
        <SpeakerIcon size={big ? 52 : 24} />
      </button>
      {withSlow && (
        <button
          type="button"
          onClick={() => playSlovak(text, { slow: true })}
          aria-label="Play slowly"
          className="btn shrink-0 !p-0 size-16 !rounded-2xl"
        >
          <TurtleIcon size={30} />
        </button>
      )}
    </span>
  );
}
