"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { BoltIcon, CheckIcon, CloseIcon, CrownIcon, StarIcon } from "@/components/icons";
import {
  BuildView,
  ChoiceView,
  FillView,
  IntroView,
  ListenView,
  MatchView,
  SpeakView,
  type Answer,
  type Resolution,
} from "@/components/lesson/exercises";
import { checkBuilt, checkTyped, shuffle, toTiles } from "@/lib/answers";
import { playSlovak } from "@/lib/audio";
import { fillSentence, findLesson, nextLessonId, type Exercise } from "@/lib/course";

type Item = { ex: Exercise; key: string; retry: boolean };
type Phase = "playing" | "done" | "paywall";
type Summary = { xp: number; score: number; seconds: number };

const praise = ["Výborne!", "Super!", "Skvelé!", "Presne tak!", "Správne!"];

/** Grades exercises that use the Check button. `tiles` is the build exercise's word bank. */
function grade(ex: Exercise, answer: Answer, tiles: string[]): Resolution {
  switch (ex.type) {
    case "choice":
      return { correct: answer === ex.answer, solution: ex.options[ex.answer] };
    case "fill":
      return {
        correct: answer === ex.answer,
        solution: fillSentence(ex.before, ex.options[ex.answer], ex.after),
      };
    case "build": {
      const words = Array.isArray(answer) ? answer.map((i) => tiles[i]) : [];
      return { ...checkBuilt(words, ex.answers), solution: ex.answers[0] };
    }
    case "listen":
      return { ...checkTyped(typeof answer === "string" ? answer : "", [ex.sk]), solution: ex.sk };
    default:
      return { correct: true };
  }
}

/** The Slovak text to read aloud after an answer is checked, if any. */
function solutionAudio(ex: Exercise): string | null {
  switch (ex.type) {
    case "choice":
      return ex.optionsLang === "sk" ? ex.options[ex.answer] : null;
    case "fill":
      return fillSentence(ex.before, ex.options[ex.answer], ex.after);
    case "build":
      return ex.promptLang === "en" ? ex.answers[0] : null;
    default:
      return null;
  }
}

function hasAnswer(answer: Answer): boolean {
  if (answer === null) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "string") return answer.trim().length > 0;
  return true;
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { ready } = useApp();
  // Wait for hydration: progress lives in localStorage, and exercises shuffle on mount.
  if (!ready) return <div className="min-h-dvh" />;
  return <Player key={lessonId} lessonId={lessonId} />;
}

function Player({ lessonId }: { lessonId: string }) {
  const { lesson, unit } = findLesson(lessonId)!;
  const router = useRouter();
  const { isPremium, completeLesson } = useApp();

  const [queue, setQueue] = useState<Item[]>(() =>
    lesson.exercises.map((ex, i) => ({ ex, key: String(i), retry: false })),
  );
  const [pos, setPos] = useState(0);
  const [phase, setPhase] = useState<Phase>(() =>
    unit.premium && !isPremium ? "paywall" : "playing",
  );
  const stats = useRef({ right: 0, graded: 0, startedAt: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    stats.current.startedAt = Date.now();
  }, []);

  const item = queue[pos];

  function onGraded(r: Resolution) {
    if (r.skipped) return;
    if (!item.retry) {
      stats.current.graded++;
      if (r.correct) stats.current.right++;
    }
    // Mistakes come back once at the end of the lesson.
    if (!r.correct && !item.retry) {
      setQueue((q) => [...q, { ex: item.ex, key: `${item.key}r`, retry: true }]);
    }
    const audio = solutionAudio(item.ex);
    if (audio) void playSlovak(audio);
  }

  function next() {
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      return;
    }
    const { right, graded, startedAt } = stats.current;
    const score = graded ? Math.round((right / graded) * 100) : 100;
    const xp = 10 + (score === 100 ? 5 : 0);
    completeLesson(lessonId, score, xp);
    setSummary({ xp, score, seconds: Math.round((Date.now() - startedAt) / 1000) });
    setPhase("done");
  }

  if (phase === "paywall") return <PaywallScreen />;
  if (phase === "done" && summary) {
    return (
      <DoneScreen
        {...summary}
        nextId={nextLessonId(lessonId)}
        onContinue={() => router.push("/learn")}
      />
    );
  }

  const progressPct = (pos / queue.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top bar */}
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 pt-6">
        <Link
          href="/learn"
          aria-label="Quit lesson"
          className="text-muted hover:text-text"
          onClick={(e) => {
            if (pos > 0 && !confirm("Quit? Your progress in this lesson will be lost.")) e.preventDefault();
          }}
        >
          <CloseIcon size={28} />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-ok transition-[width] duration-300"
            style={{ width: `${Math.max(progressPct, 2)}%` }}
          />
        </div>
      </div>

      <Step key={item.key} exercise={item.ex} onGraded={onGraded} onNext={next} />
    </div>
  );
}

/** One exercise: owns its answer, word tiles and result. Remounted per queue item. */
function Step({
  exercise: ex,
  onGraded,
  onNext,
}: {
  exercise: Exercise;
  onGraded: (r: Resolution) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState<Answer>(null);
  const [result, setResult] = useState<Resolution | null>(null);
  const [tiles] = useState(() =>
    ex.type === "build" ? shuffle([...toTiles(ex.answers[0]), ...ex.distractors]) : [],
  );

  const isIntro = ex.type === "intro";
  const selfGraded = ex.type === "match" || ex.type === "speak";
  const locked = result !== null;

  const resolve = (r: Resolution) => {
    setResult(r);
    onGraded(r);
  };
  const check = () => {
    if (!result && hasAnswer(answer)) resolve(grade(ex, answer, tiles));
  };

  // Enter checks or continues. Re-subscribed every render so it sees fresh state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (result || isIntro) onNext();
      else if (!selfGraded) check();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {ex.type === "intro" && <IntroView exercise={ex} />}
        {ex.type === "choice" && (
          <ChoiceView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
        )}
        {ex.type === "fill" && (
          <FillView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
        )}
        {ex.type === "build" && (
          <BuildView exercise={ex} tiles={tiles} answer={answer} setAnswer={setAnswer} locked={locked} />
        )}
        {ex.type === "listen" && (
          <ListenView exercise={ex} answer={answer} setAnswer={setAnswer} locked={locked} />
        )}
        {ex.type === "match" && <MatchView exercise={ex} onResolve={resolve} locked={locked} />}
        {ex.type === "speak" && <SpeakView exercise={ex} onResolve={resolve} locked={locked} />}
      </div>

      <Footer
        result={result}
        canCheck={hasAnswer(answer)}
        mode={isIntro ? "continue" : selfGraded ? "self" : "check"}
        onCheck={check}
        onNext={onNext}
        onSkip={ex.type === "speak" ? onNext : undefined}
      />
    </>
  );
}

function Footer({
  result,
  canCheck,
  mode,
  onCheck,
  onNext,
  onSkip,
}: {
  result: Resolution | null;
  canCheck: boolean;
  mode: "check" | "continue" | "self";
  onCheck: () => void;
  onNext: () => void;
  onSkip?: () => void;
}) {
  const [word] = useState(() => praise[Math.floor(Math.random() * praise.length)]);

  if (result) {
    const ok = result.correct;
    return (
      <footer className={`animate-slide-up ${ok ? "bg-ok-soft" : "bg-bad-soft"}`}>
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-full bg-bg ${ok ? "text-ok" : "text-bad"}`}
            >
              {ok ? <CheckIcon size={30} /> : <CloseIcon size={30} />}
            </span>
            <div className={ok ? "text-ok-dark" : "text-bad"}>
              <p className="text-2xl font-black">{ok ? word : "Correct solution:"}</p>
              {!ok && result.solution && <p className="text-lg font-semibold">{result.solution}</p>}
              {result.heard !== undefined && (
                <p className="text-sm font-semibold opacity-80">We heard: “{result.heard || "…"}”</p>
              )}
              {result.note && <p className="text-sm font-semibold">{result.note}</p>}
            </div>
          </div>
          <button type="button" onClick={onNext} className={`btn ${ok ? "btn-ok" : "btn-bad"} sm:min-w-40`}>
            Continue
          </button>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t-2 border-border">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6">
        {onSkip ? (
          <button type="button" onClick={onSkip} className="btn btn-ghost">
            Can&apos;t speak now
          </button>
        ) : (
          <span />
        )}
        {mode === "continue" ? (
          <button type="button" onClick={onNext} className="btn btn-ok sm:min-w-40">
            Continue
          </button>
        ) : mode === "check" ? (
          <button type="button" onClick={onCheck} disabled={!canCheck} className="btn btn-ok sm:min-w-40">
            Check
          </button>
        ) : null}
      </div>
    </footer>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      {children}
    </div>
  );
}

function DoneScreen({
  xp,
  score,
  seconds,
  nextId,
  onContinue,
}: {
  xp: number;
  score: number;
  seconds: number;
  nextId: string | null;
  onContinue: () => void;
}) {
  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <Screen>
      <StarIcon size={96} className="animate-pop text-gold" />
      <div>
        <h1 className="text-3xl font-black text-gold">Lesson complete!</h1>
        <p className="mt-1 text-muted">{score === 100 ? "Perfect lesson. Bez chyby!" : "Keep it up!"}</p>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        <Stat label="Total XP" value={`+${xp}`} color="var(--gold)" icon={<BoltIcon size={20} />} />
        <Stat label="Accuracy" value={`${score}%`} color="var(--ok)" icon={<CheckIcon size={20} />} />
        <Stat label="Time" value={time} color="var(--brand)" icon={<StarIcon size={20} />} />
      </div>
      <div className="flex w-full flex-col gap-3">
        {nextId && (
          <Link href={`/lesson/${nextId}`} className="btn btn-ok w-full">
            Next lesson
          </Link>
        )}
        <button type="button" onClick={onContinue} className="btn btn-ghost w-full">
          Back to path
        </button>
      </div>
    </Screen>
  );
}

function Stat({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-2" style={{ borderColor: color }}>
      <p className="py-1 text-xs font-extrabold uppercase text-white" style={{ background: color }}>
        {label}
      </p>
      <p className="flex items-center justify-center gap-1 py-3 text-xl font-black" style={{ color }}>
        {icon}
        {value}
      </p>
    </div>
  );
}

function PaywallScreen() {
  return (
    <Screen>
      <CrownIcon size={96} className="text-gold" />
      <div>
        <h1 className="text-3xl font-black">This is a Premium unit</h1>
        <p className="mt-2 text-muted">Unlock every unit of the A1 course with Slovko Premium.</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link href="/pricing" className="btn btn-gold w-full">
          See plans
        </Link>
        <Link href="/learn" className="btn btn-ghost w-full">
          Back to path
        </Link>
      </div>
    </Screen>
  );
}
