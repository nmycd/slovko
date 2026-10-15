"use client";

// Slovak audio playback: ElevenLabs via /api/tts, falling back to the
// browser's own speech synthesis when TTS isn't configured or fails.

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store";

const urls = new Map<string, Promise<string | null>>();
let ttsUnavailable = false;
let current: HTMLAudioElement | null = null;
// Bumped whenever playback should stop, so a clip that is still loading
// (or its speech-synthesis fallback) never starts after the learner moved on.
let generation = 0;

function loadAudio(text: string): Promise<string | null> {
  let pending = urls.get(text);
  if (!pending) {
    pending = fetch(`/api/tts?text=${encodeURIComponent(text)}`)
      .then(async (res) => {
        if (res.status === 503) ttsUnavailable = true;
        if (!res.ok) {
          urls.delete(text);
          return null;
        }
        return URL.createObjectURL(await res.blob());
      })
      .catch(() => {
        urls.delete(text);
        return null;
      });
    urls.set(text, pending);
  }
  return pending;
}

/** Start fetching a phrase so it plays instantly later. */
export function preloadSlovak(text: string) {
  if (!ttsUnavailable) void loadAudio(text);
}

/**
 * Fetches a lesson's clips in the background, in lesson order and a few at a time,
 * so each one plays at once when its exercise comes up.
 */
export function preloadLesson(texts: string[]) {
  const queue = [...new Set(texts)].filter((text) => !urls.has(text));
  const next = (): Promise<void> => {
    const text = queue.shift();
    if (text === undefined || ttsUnavailable) return Promise.resolve();
    return loadAudio(text).then(next);
  };
  for (let i = 0; i < 3; i++) void next();
}

// Playback volume, 0–1, kept on the device.
const VOLUME_KEY = "slovko:volume";
const DEFAULT_VOLUME = 0.8;
const volumeStore = createStore(
  DEFAULT_VOLUME,
  () => {
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      const value = Number(saved);
      return saved !== null && value >= 0 && value <= 1 ? value : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  },
  (value) => {
    try {
      localStorage.setItem(VOLUME_KEY, String(value));
    } catch {}
  },
);

export function useVolume(): number {
  return useSyncExternalStore(volumeStore.subscribe, volumeStore.get, () => DEFAULT_VOLUME);
}

/** Sets the volume, for the clip playing now too. */
export function setVolume(value: number) {
  volumeStore.set(value);
  if (current) current.volume = value;
}

let volumeSettable: boolean | undefined;

/** Whether the page may set the volume at all: iPhones and iPads leave it to their buttons. */
export function canSetVolume(): boolean {
  if (volumeSettable === undefined) {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeSettable = probe.volume === 0.5;
  }
  return volumeSettable;
}

// Whether a clip is loading or playing, for the mic to step aside meanwhile (see useRecorder).
let playing = false;
const playingListeners = new Set<() => void>();

function setPlaying(value: boolean) {
  if (playing === value) return;
  playing = value;
  playingListeners.forEach((listener) => listener());
}

/** True while Slovak audio is loading or playing. */
export function useSlovakPlaying(): boolean {
  return useSyncExternalStore(
    (listener) => {
      playingListeners.add(listener);
      return () => playingListeners.delete(listener);
    },
    () => playing,
    () => false,
  );
}

/** Stops whatever is playing and cancels clips that are still loading. */
export function stopSlovak() {
  generation++;
  current?.pause();
  current = null;
  window.speechSynthesis?.cancel();
  setPlaying(false);
}

export async function playSlovak(text: string, { slow = false } = {}) {
  stopSlovak();
  const playId = generation;
  const ended = () => {
    if (playId === generation) setPlaying(false);
  };
  setPlaying(true);
  if (!ttsUnavailable) {
    const url = await loadAudio(text);
    if (playId !== generation) return; // superseded while loading
    if (url) {
      const audio = new Audio(url);
      audio.playbackRate = slow ? 0.7 : 1;
      audio.volume = volumeStore.get();
      audio.onended = ended;
      audio.onpause = ended; // also interrupted by the system
      current = audio;
      try {
        await audio.play();
        return;
      } catch {
        // Stopped on purpose: stay quiet. Otherwise (autoplay blocked, decode
        // error) fall through to speech synthesis.
        if (playId !== generation) return;
      }
    }
  }
  if (playId === generation) speakWithBrowser(text, slow, ended);
}

function speakWithBrowser(text: string, slow: boolean, ended: () => void) {
  const synth = window.speechSynthesis;
  if (!synth) return ended();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = ended;
  utterance.onerror = ended;
  utterance.lang = "sk-SK";
  utterance.volume = volumeStore.get();
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("sk"));
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.6 : 0.9;
  synth.speak(utterance);
}
