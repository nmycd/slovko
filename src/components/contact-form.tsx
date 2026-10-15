"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/app-provider";
import { CheckIcon } from "@/components/icons";
import { contactLimits, type ContactError } from "@/lib/contact";
import type { MessageKey } from "@/lib/i18n";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border-strong bg-bg px-4 py-3 outline-none focus:border-accent";

const errorMessages: Record<ContactError, MessageKey> = {
  invalid: "contact.error.invalid",
  too_fast: "contact.error.tooFast",
  rate_limited: "contact.error.rateLimited",
  unavailable: "contact.error.failed",
  failed: "contact.error.failed",
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; error: ContactError };

/** The server's signed timestamp: proof the form was open for a few seconds. */
function fetchToken(): Promise<string | null> {
  return fetch("/api/contact", { cache: "no-store" })
    .then((res) => res.json() as Promise<{ token?: string }>)
    .then((data) => data.token ?? null)
    .catch(() => null);
}

export function ContactForm() {
  const { user, locale, t } = useApp();
  const [name, setName] = useState("");
  // null until the visitor edits it, so it shows the signed-in account's address.
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: people never see it
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const token = useRef<Promise<string | null> | null>(null);
  const email = typedEmail ?? user?.email ?? "";

  useEffect(() => {
    token.current = fetchToken();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          locale,
          website,
          token: await (token.current ?? fetchToken()),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: ContactError };
      if (data.ok) {
        setStatus({ kind: "sent", email });
        setMessage("");
      } else {
        setStatus({ kind: "error", error: data.error ?? "failed" });
      }
    } catch {
      setStatus({ kind: "error", error: "failed" });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="card p-6 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckIcon size={28} />
        </span>
        <h1 className="mt-4 text-2xl">{t("contact.sent.title")}</h1>
        <p className="mt-2 text-muted">{t("contact.sent.body", { email: status.email })}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/learn" className="btn flex-1">
            {t("contact.backToLearning")}
          </Link>
          <button type="button" onClick={() => setStatus({ kind: "idle" })} className="btn btn-ghost flex-1">
            {t("contact.sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  const sending = status.kind === "sending";
  return (
    <div>
      <h1 className="text-3xl">{t("contact.title")}</h1>
      <p className="mt-2 text-muted">{t("contact.intro")}</p>

      <form onSubmit={submit} className="card mt-6 space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-semibold">{t("contact.name")}</span>
            <input
              type="text"
              required
              autoComplete="name"
              maxLength={contactLimits.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-semibold">{t("contact.email")}</span>
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={contactLimits.email}
              value={email}
              onChange={(e) => setTypedEmail(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1.5 block font-semibold">{t("contact.message")}</span>
          <textarea
            required
            minLength={contactLimits.messageMin}
            maxLength={contactLimits.messageMax}
            placeholder={t("contact.messagePlaceholder")}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${inputClass} block h-[clamp(6rem,18vh,16rem)] resize-y`}
          />
        </label>
        {/* Honeypot: off-screen and hidden from assistive tech, so only bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            {t("contact.honeypot")}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {status.kind === "error" && (
          <p role="alert" className="text-sm font-bold text-bad">
            {t(errorMessages[status.error] ?? "contact.error.failed", { n: contactLimits.messageMin })}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted sm:text-left">{t("contact.privacy")}</p>
          <button type="submit" disabled={sending} className="btn shrink-0">
            {t(sending ? "contact.sending" : "contact.send")}
          </button>
        </div>
      </form>
    </div>
  );
}
