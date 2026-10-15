import { createHmac, timingSafeEqual } from "node:crypto";
import { after, connection } from "next/server";
import { contactLimits, isPlausibleEmail, type ContactError } from "@/lib/contact";
import { isLocale } from "@/lib/i18n";
import { isContactEmailConfigured, sendContactEmail } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/server";

// GET  /api/contact → { token }   (fetched when the form opens)
// POST /api/contact  { name, email, message, locale, token, website } → { ok } | { error: ContactError }
//
// Spam protection without a CAPTCHA: `website` is a honeypot field people
// never see, the signed token proves the form was open for a few seconds,
// and each sender (by email or IP) may send a few messages an hour.

const MIN_FILL_MS = 3_000;
const HOUR_MS = 60 * 60 * 1000;
const PER_SENDER_PER_HOUR = 3;
// Bounds the inbox (and the email quota) during a wave of spam from many addresses.
const ALL_PER_HOUR = 30;

/** HMAC with the server's Supabase secret: signs form tokens and hashes IPs. */
function sign(value: string): string {
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createHmac("sha256", key).update(value).digest("base64url");
}

export async function GET() {
  await connection(); // a fresh timestamp on every request, never prerendered
  const issued = String(Date.now());
  return Response.json(
    { token: `${issued}.${sign(`contact:${issued}`)}` },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Milliseconds since the token was issued, or null if it wasn't issued by us. */
function tokenAge(token: unknown): number | null {
  if (typeof token !== "string") return null;
  const [issued, mac = ""] = token.split(".");
  const expected = Buffer.from(sign(`contact:${issued}`));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return Date.now() - Number(issued);
}

const fail = (error: ContactError, status: number) => Response.json({ error }, { status });
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export async function POST(request: Request) {
  const admin = getSupabaseAdmin();
  if (!admin) return fail("unavailable", 503);

  const body: Record<string, unknown> | null = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("invalid", 400);

  // Bots fill in every field, including the hidden one. Let them think it worked.
  if (body.website) return Response.json({ ok: true });

  const age = tokenAge(body.token);
  if (age === null) return fail("invalid", 400);
  if (age < MIN_FILL_MS) return fail("too_fast", 400);

  const name = text(body.name).replace(/\s+/g, " ");
  const email = text(body.email).toLowerCase();
  const message = text(body.message);
  if (
    !name ||
    name.length > contactLimits.name ||
    !isPlausibleEmail(email) ||
    message.length < contactLimits.messageMin ||
    message.length > contactLimits.messageMax
  ) {
    return fail("invalid", 400);
  }
  const locale = isLocale(body.locale) ? body.locale : null;

  // Vercel sets x-forwarded-for to the client's address.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip");
  const ipHash = ip ? sign(`ip:${ip}`) : null;

  const { data: recent, error: readError } = await admin
    .from("contact_messages")
    .select("email, ip_hash")
    .gte("created_at", new Date(Date.now() - HOUR_MS).toISOString())
    .limit(ALL_PER_HOUR);
  if (readError) {
    console.error("Contact rate limit check failed:", readError.message);
    return fail("failed", 500);
  }
  const fromSender = recent.filter((m) => m.email === email || (ipHash && m.ip_hash === ipHash));
  if (recent.length >= ALL_PER_HOUR || fromSender.length >= PER_SENDER_PER_HOUR) {
    return fail("rate_limited", 429);
  }

  const user = await getCurrentUser();
  const { error } = await admin.from("contact_messages").insert({
    name,
    email,
    message,
    locale,
    user_id: user?.id ?? null,
    ip_hash: ipHash,
  });
  if (error) {
    console.error("Contact message not saved:", error.message);
    return fail("failed", 500);
  }

  // The message is saved; the email is a courtesy and must not hold up the reply.
  if (isContactEmailConfigured()) {
    after(() =>
      sendContactEmail({ name, email, message, locale, userId: user?.id ?? null }).catch((err) =>
        console.error("Contact email failed:", err),
      ),
    );
  }
  return Response.json({ ok: true });
}
