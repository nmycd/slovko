"use client";

// Microphone recording for speaking cards.
//
// People start talking as they tap and tap "stop" as they finish, so a recording that
// starts only once the mic has opened (a few hundred ms later) loses the first
// syllable, and the answer fails. So the mic is opened ahead of time ("warm") while a
// speaking card waits for an answer, and each recording keeps the moment before the tap
// and runs a moment past the stop. Audio is captured as raw samples and sent as 16 kHz
// mono WAV, which is what recognisers work with anyway.

import { useCallback, useEffect, useRef, useState } from "react";
import type { MessageKey } from "@/lib/i18n";

const MAX_SECONDS = 10;
/** Kept from before the tap. */
const PRE_ROLL_SECONDS = 0.5;
/** Recorded after the stop. */
const POST_ROLL_SECONDS = 0.4;
/** Peak RMS below this means the mic picked up (almost) nothing. */
const SILENCE_RMS = 0.015;
const WAV_RATE = 16000;

export type Recording = {
  audio: Blob;
  /** True when no speech-level sound reached the mic, e.g. the wrong input device is selected. */
  silent: boolean;
  /** Loudest moment (RMS of a ~40 ms block), 0–1. */
  peak: number;
  deviceLabel: string | null;
};

/** An open microphone, passing its samples on in blocks. */
type Mic = {
  ctx: AudioContext;
  label: string | null;
  /** The last moment of sound, for a recording's pre-roll. */
  recent: Float32Array[];
  /** Receives each block while a recording is running. */
  onBlock: ((block: Float32Array) => void) | null;
  close: () => void;
};

// Runs on the audio thread: forwards the mic's samples in blocks of 2048.
const WORKLET = `registerProcessor("slovko-mic", class extends AudioWorkletProcessor {
  constructor() { super(); this.block = new Float32Array(2048); this.n = 0; }
  process(inputs) {
    const samples = inputs[0][0];
    if (samples) for (let i = 0; i < samples.length; i++) {
      this.block[this.n++] = samples[i];
      if (this.n === this.block.length) {
        this.port.postMessage(this.block, [this.block.buffer]);
        this.block = new Float32Array(2048);
        this.n = 0;
      }
    }
    return true;
  }
});`;

class MicBlocked extends Error {}

async function openMic(onLost: () => void): Promise<Mic> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    throw new MicBlocked();
  }
  try {
    const ctx = new AudioContext();
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" }));
    try {
      await ctx.audioWorklet.addModule(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    const node = new AudioWorkletNode(ctx, "slovko-mic");
    // Silent route to the speakers, so every browser keeps the node running.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    ctx.createMediaStreamSource(stream).connect(node).connect(mute).connect(ctx.destination);

    const keep = PRE_ROLL_SECONDS * ctx.sampleRate;
    const track = stream.getAudioTracks()[0];
    const mic: Mic = {
      ctx,
      label: track?.label || null,
      recent: [],
      onBlock: null,
      close: () => {
        node.port.onmessage = null;
        stream.getTracks().forEach((t) => t.stop());
        void ctx.close();
      },
    };
    node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      mic.recent.push(e.data);
      while (mic.recent.length > 1 && (mic.recent.length - 1) * e.data.length >= keep) mic.recent.shift();
      mic.onBlock?.(e.data);
    };
    if (track) track.onended = onLost; // unplugged, or taken by another app
    return mic;
  } catch (err) {
    stream.getTracks().forEach((t) => t.stop());
    throw err;
  }
}

/** Whether the site may use the mic without asking (so opening it early prompts nobody). */
async function micAllowed(): Promise<boolean> {
  try {
    const status = await navigator.permissions.query({ name: "microphone" as PermissionName });
    return status.state === "granted";
  } catch {
    return false; // can't tell (some browsers): open it on the first tap instead
  }
}

/**
 * Recording with a live input level, so the learner can see the mic is working. Stops
 * itself after 10 s. While `warm` is true and the site already has mic permission,
 * the mic is kept open so a recording starts the instant it's asked for.
 */
export function useRecorder(warm: boolean) {
  const [recording, setRecording] = useState(false);
  /** Stopped, but still taking in the last moment of sound. */
  const [finishing, setFinishing] = useState(false);
  /** Message key of the last microphone problem. */
  const [error, setError] = useState<MessageKey | null>(null);
  /** Current input level, 0–1, for a meter. */
  const [level, setLevel] = useState(0);
  /** Name of the microphone the browser picked, e.g. "MacBook Pro Microphone". */
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);

  const mic = useRef<Promise<Mic> | null>(null);
  /** The open mic, once it is: a tap can wake its audio at once (some browsers allow that only during the tap). */
  const ready = useRef<Mic | null>(null);
  const take = useRef<{ stop: () => void; cancel: () => void } | null>(null);
  const warmNow = useRef(warm);

  const close = useCallback(() => {
    const opened = mic.current;
    mic.current = null;
    ready.current = null;
    opened?.then(
      (m) => m.close(),
      () => {},
    );
  }, []);

  const open = useCallback((): Promise<Mic> => {
    if (!mic.current) {
      const opening: Promise<Mic> = openMic(() => {
        if (mic.current === opening) close();
      });
      mic.current = opening;
      opening.then(
        (m) => {
          if (mic.current === opening) ready.current = m;
        },
        () => {
          if (mic.current === opening) mic.current = null;
        },
      );
    }
    return mic.current;
  }, [close]);

  useEffect(() => {
    warmNow.current = warm;
    if (!warm) {
      if (!take.current) close();
      return;
    }
    let cancelled = false;
    void micAllowed().then((ok) => {
      if (ok && !cancelled) open().catch(() => {});
    });
    return () => {
      cancelled = true;
    };
  }, [warm, open, close]);

  useEffect(
    () => () => {
      take.current?.cancel();
      close();
    },
    [close],
  );

  const stop = useCallback(() => take.current?.stop(), []);

  /** Starts recording; resolves once stop() is called (or after 10 s), with null if cancelled. */
  const start = useCallback(async (): Promise<Recording | null> => {
    if (take.current) return null;
    setError(null);
    void ready.current?.ctx.resume(); // opened ahead of time, it may have waited for a tap
    let m: Mic;
    try {
      m = await open();
      void m.ctx.resume();
    } catch (err) {
      setError(err instanceof MicBlocked ? "ex.mic.blocked" : "ex.mic.failed");
      return null;
    }
    if (take.current) return null;
    setDeviceLabel(m.label);

    const rate = m.ctx.sampleRate;
    const blocks = [...m.recent];
    let peak = 0;
    let lastPaint = 0;
    let stopping = false;
    const loudness = (block: Float32Array) => {
      let sum = 0;
      for (const s of block) sum += s * s;
      return Math.sqrt(sum / block.length);
    };
    blocks.forEach((b) => (peak = Math.max(peak, loudness(b))));

    return new Promise<Recording | null>((resolve) => {
      let tail: ReturnType<typeof setTimeout> | undefined;
      const finish = (keep: boolean) => {
        clearTimeout(limit);
        clearTimeout(tail);
        m.onBlock = null;
        take.current = null;
        setRecording(false);
        setFinishing(false);
        setLevel(0);
        if (!warmNow.current) close();
        resolve(
          keep && blocks.length
            ? { audio: toWav(blocks, rate), silent: peak < SILENCE_RMS, peak, deviceLabel: m.label }
            : null,
        );
      };
      const stopTake = () => {
        if (stopping) return;
        stopping = true;
        setRecording(false);
        setFinishing(true);
        setLevel(0);
        tail = setTimeout(() => finish(true), POST_ROLL_SECONDS * 1000);
      };
      const limit = setTimeout(stopTake, MAX_SECONDS * 1000);
      m.onBlock = (block) => {
        blocks.push(block);
        const rms = loudness(block);
        peak = Math.max(peak, rms);
        const now = performance.now();
        if (!stopping && now - lastPaint > 80) {
          lastPaint = now;
          setLevel(Math.min(1, rms * 8));
        }
      };
      take.current = { stop: stopTake, cancel: () => finish(false) };
      setRecording(true);
    });
  }, [open, close]);

  return { recording, finishing, error, level, deviceLabel, start, stop };
}

/** Blocks of samples at `rate` → 16 kHz, 16-bit mono WAV. */
function toWav(blocks: Float32Array[], rate: number): Blob {
  const total = blocks.reduce((n, b) => n + b.length, 0);
  const input = new Float32Array(total);
  let at = 0;
  for (const b of blocks) {
    input.set(b, at);
    at += b.length;
  }
  // Downsample by averaging each output sample's span (which also filters out what 16 kHz can't hold).
  const ratio = rate / WAV_RATE;
  const length = Math.floor(total / ratio);
  const out = new DataView(new ArrayBuffer(44 + length * 2));
  for (let i = 0; i < length; i++) {
    const from = Math.floor(i * ratio);
    const to = Math.max(from + 1, Math.min(total, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = from; j < to; j++) sum += input[j];
    const s = Math.max(-1, Math.min(1, sum / (to - from)));
    out.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const text = (offset: number, s: string) => [...s].forEach((c, i) => out.setUint8(offset + i, c.charCodeAt(0)));
  text(0, "RIFF");
  out.setUint32(4, 36 + length * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  out.setUint32(16, 16, true); // fmt chunk size
  out.setUint16(20, 1, true); // PCM
  out.setUint16(22, 1, true); // mono
  out.setUint32(24, WAV_RATE, true);
  out.setUint32(28, WAV_RATE * 2, true); // bytes per second
  out.setUint16(32, 2, true); // bytes per sample frame
  out.setUint16(34, 16, true); // bits per sample
  text(36, "data");
  out.setUint32(40, length * 2, true);
  return new Blob([out.buffer], { type: "audio/wav" });
}
