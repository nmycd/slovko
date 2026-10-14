"use client";

// Slovak audio playback: ElevenLabs via /api/tts, falling back to the
// browser's own speech synthesis when TTS isn't configured or fails.

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

/** Stops whatever is playing and cancels clips that are still loading. */
export function stopSlovak() {
  generation++;
  current?.pause();
  current = null;
  window.speechSynthesis?.cancel();
}

export async function playSlovak(text: string, { slow = false } = {}) {
  stopSlovak();
  const playId = generation;
  if (!ttsUnavailable) {
    const url = await loadAudio(text);
    if (playId !== generation) return; // superseded while loading
    if (url) {
      const audio = new Audio(url);
      audio.playbackRate = slow ? 0.7 : 1;
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
  if (playId === generation) speakWithBrowser(text, slow);
}

function speakWithBrowser(text: string, slow: boolean) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "sk-SK";
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("sk"));
  if (voice) utterance.voice = voice;
  utterance.rate = slow ? 0.6 : 0.9;
  synth.speak(utterance);
}
