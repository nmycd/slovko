"use client";

import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/components/app-provider";
import { BoltIcon, MicIcon, SpeakerIcon } from "@/components/icons";
import { SignedInRedirect } from "@/components/signed-in-redirect";
import { featuredEndorsement, type Endorsement } from "@/lib/endorsement";
import type { MessageKey } from "@/lib/i18n";

const features: { icon: typeof SpeakerIcon; title: MessageKey; body: MessageKey }[] = [
  { icon: SpeakerIcon, title: "landing.f1.title", body: "landing.f1.body" },
  { icon: MicIcon, title: "landing.f2.title", body: "landing.f2.body" },
  { icon: BoltIcon, title: "landing.f3.title", body: "landing.f3.body" },
];

export function Landing() {
  const { t } = useApp();
  const tiles = t("landing.demo.tiles").split("|");
  const selected = new Set(t("landing.demo.selected").split(",").map(Number));
  return (
    <div className="mx-auto max-w-5xl px-4">
      <SignedInRedirect to="/learn" />
      <section className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">
            {t("landing.title")}
            <br />
            <span className="text-brand">Krok za krokom.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">{t("landing.subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:max-w-xs">
            <Link href="/learn" className="btn">
              {t("landing.getStarted")}
            </Link>
            <Link href="/login" className="btn btn-ghost">
              {t("landing.haveAccount")}
            </Link>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="card mx-auto max-w-sm rotate-1 p-6 shadow-[0_12px_32px_rgba(31,30,27,0.07)]">
            <p className="text-sm font-semibold text-muted">
              {t("landing.demo.label")}
            </p>
            <p className="mt-3 font-serif text-2xl font-medium">Dobrý deň!</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tiles.map((w, i) => (
                <span key={w} className="tile px-3 py-2" data-state={selected.has(i) ? "selected" : undefined}>
                  {w}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-ok-soft p-3 font-semibold text-ok-dark">
              Výborne! {t("landing.demo.correct")}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <Icon size={28} className="text-brand" />
            <h2 className="mt-3 text-lg">{t(title)}</h2>
            <p className="mt-1 text-muted">{t(body)}</p>
          </div>
        ))}
      </section>

      <section className="pb-20">
        <TeacherQuote endorsement={featuredEndorsement} />
      </section>
    </div>
  );
}

function TeacherQuote({ endorsement: e }: { endorsement: Endorsement }) {
  const { t } = useApp();
  // Academic titles like "Mgr." don't count towards the initials.
  const initials = e.name
    .split(" ")
    .filter((part) => !part.endsWith("."))
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <figure className="card relative overflow-hidden p-6 sm:p-10">
      <span
        aria-hidden
        className="absolute -top-8 left-4 select-none text-[10rem] font-semibold leading-none text-brand-soft"
      >
        “
      </span>
      <p className="relative text-sm font-semibold text-brand">
        {t("landing.teachers")}
      </p>
      <blockquote className="relative mt-3 font-serif text-xl leading-relaxed sm:text-2xl">
        {t("endorsement.quote")}
      </blockquote>
      <figcaption className="relative mt-6 flex items-center gap-4">
        {e.photo ? (
          <Image src={e.photo} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
        ) : (
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-lichen text-lg font-semibold text-brand"
          >
            {initials}
          </span>
        )}
        <div>
          <p className="font-semibold">{e.name}</p>
          <p className="text-muted">
            {t("endorsement.role")} · {t("endorsement.affiliation")}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
