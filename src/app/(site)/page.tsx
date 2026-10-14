import Link from "next/link";
import { BoltIcon, MicIcon, SpeakerIcon } from "@/components/icons";

const features = [
  {
    icon: SpeakerIcon,
    title: "Hear real Slovak",
    body: "Every phrase is voiced, so you learn the sounds of č, ľ and ô from day one.",
  },
  {
    icon: MicIcon,
    title: "Speak out loud",
    body: "Say the phrase and get instant feedback on your pronunciation.",
  },
  {
    icon: BoltIcon,
    title: "Five minutes a day",
    body: "Short lessons, streaks and XP keep you coming back. Built around the CEFR A1 level.",
  },
];

export default function Landing() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Learn Slovak.
            <br />
            <span className="text-brand">Krok za krokom.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            Bite-sized lessons that take you from <em>Ahoj!</em> to real conversations, with native
            audio and speaking practice.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:max-w-xs">
            <Link href="/learn" className="btn">
              Get started
            </Link>
            <Link href="/login" className="btn btn-ghost">
              I already have an account
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="card mx-auto max-w-sm rotate-1 p-6 shadow-[0_6px_0_var(--border)]">
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted">Translate</p>
            <p className="mt-3 text-2xl font-black">Dobrý deň!</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Good", "morning", "day", "Hello"].map((w, i) => (
                <span key={w} className="tile px-3 py-2" data-state={i === 3 ? "selected" : undefined}>
                  {w}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-ok-soft p-3 font-extrabold text-ok-dark">Výborne! Correct.</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon size={28} className="text-brand" />
            <h2 className="mt-3 text-lg font-black">{title}</h2>
            <p className="mt-1 text-muted">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
