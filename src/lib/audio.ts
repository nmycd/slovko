"use client";

// Slovak audio playback: ElevenLabs via /api/tts, falling back to the
// browser's own speech synthesis when TTS isn't configured or fails.

import { useSyncExternalStore } from "react";
import { isSilentTile, TILE_CLIPS_VERSION, type TileStyle } from "@/lib/course/helpers";
import { createStore } from "@/lib/store";

/**
 * A clip to play: a course phrase, or a word tile `in` its exercise
 * ("u3-l1#build-kde-je"), which plays the word as cut from that exercise's sentence;
 * in dev mode, in one of the `style`s compared.
 */
export type Clip = string | { text: string; in: string; style?: TileStyle };

const query = (clip: Clip) =>
  typeof clip === "string"
    ? `text=${encodeURIComponent(clip)}`
    : `text=${encodeURIComponent(clip.text)}&in=${encodeURIComponent(clip.in)}&v=${TILE_CLIPS_VERSION}` +
      (clip.style ? `&style=${clip.style}` : "");

/** Object URLs of loaded clips, by query. */
const urls = new Map<string, Promise<string | null>>();
let ttsUnavailable = false;
let current: HTMLAudioElement | null = null;
// Bumped whenever playback should stop, so a clip that is still loading
// (or its speech-synthesis fallback) never starts after the learner moved on.
let generation = 0;

function loadAudio(clip: Clip): Promise<string | null> {
  const key = query(clip);
  let pending = urls.get(key);
  if (!pending) {
    pending = fetch(`/api/tts?${key}`)
      .then(async (res) => {
        if (res.status === 503) ttsUnavailable = true;
        if (!res.ok) {
          urls.delete(key);
          return null;
        }
        return URL.createObjectURL(await res.blob());
      })
      .catch(() => {
        urls.delete(key);
        return null;
      });
    urls.set(key, pending);
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
export function preloadLesson(clips: Clip[]) {
  const queue = [...new Map(clips.map((clip) => [query(clip), clip])).entries()]
    .filter(([key]) => !urls.has(key))
    .map(([, clip]) => clip);
  const next = (): Promise<void> => {
    const clip = queue.shift();
    if (clip === undefined || ttsUnavailable) return Promise.resolve();
    return loadAudio(clip).then(next);
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

/**
 * Plays a word tile of a word-order exercise: the word as cut from the exercise's
 * sentence (`exercise`: "u3-l1#build-kde-je"), else its own clip; in dev mode, in
 * one of the `style`s compared. The one-letter prepositions play nothing, being part
 * of the next word when said.
 */
export function playTile(word: string, exercise?: string, style?: TileStyle) {
  if (isSilentTile(word)) return stopSlovak();
  void playSlovak(exercise ? { text: word, in: exercise, style } : word);
}

export async function playSlovak(clip: Clip, { slow = false } = {}) {
  stopSlovak();
  const text = typeof clip === "string" ? clip : clip.text;
  const playId = generation;
  const ended = () => {
    if (playId === generation) setPlaying(false);
  };
  setPlaying(true);
  if (!ttsUnavailable) {
    const url = await loadAudio(clip);
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
  // A style compared in dev mode has no stand-in: the browser's voice would pass for it.
  if (typeof clip !== "string" && clip.style) return ended();
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
