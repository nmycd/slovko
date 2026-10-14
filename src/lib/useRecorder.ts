"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_SECONDS = 10;
/** Peak RMS below this means the mic picked up (almost) nothing. */
const SILENCE_RMS = 0.015;

export type Recording = {
  audio: Blob;
  /** True when no speech-level sound reached the mic, e.g. the wrong input device is selected. */
  silent: boolean;
  deviceLabel: string | null;
};

/**
 * Microphone recording with MediaRecorder, plus a live input level so the
 * learner can see the mic is working. Stops itself after 10 s.
 */
export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Current input level, 0–1, for a meter. */
  const [level, setLevel] = useState(0);
  /** Name of the microphone the browser picked, e.g. "MacBook Pro Microphone". */
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, []);

  /** Starts recording; resolves once stop() is called (or after 10 s). */
  const start = useCallback(async (): Promise<Recording | null> => {
    setError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was blocked. Allow it in your browser's site settings.");
      return null;
    }
    const label = stream.getAudioTracks()[0]?.label || null;
    setDeviceLabel(label);

    // Measure loudness while recording.
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let peak = 0;
    let frame = 0;
    let lastPaint = 0;
    const measure = (t: number) => {
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (const s of samples) sum += s * s;
      const rms = Math.sqrt(sum / samples.length);
      peak = Math.max(peak, rms);
      if (t - lastPaint > 80) {
        lastPaint = t;
        setLevel(Math.min(1, rms * 8));
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Recording | null>((resolve) => {
      rec.onstop = () => {
        cancelAnimationFrame(frame);
        void ctx.close();
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setLevel(0);
        const audio = chunks.length ? new Blob(chunks, { type: rec.mimeType }) : null;
        resolve(audio && { audio, silent: peak < SILENCE_RMS, deviceLabel: label });
      };
    });
    recorder.current = rec;
    rec.start();
    setRecording(true);
    timer.current = setTimeout(stop, MAX_SECONDS * 1000);
    return done;
  }, [stop]);

  useEffect(() => stop, [stop]);

  return { recording, error, level, deviceLabel, start, stop };
}
