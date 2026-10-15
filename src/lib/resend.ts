// Optional email notification for contact messages, through Resend's REST API.
// Server only. Without RESEND_API_KEY and CONTACT_TO_EMAIL, messages are only
// stored in Supabase (contact_messages).

const API = "https://api.resend.com/emails";

// onboarding@resend.dev works without a verified domain, but Resend then only
// delivers to the address the Resend account was created with.
const DEFAULT_FROM = "Slovko <onboarding@resend.dev>";

export function isContactEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL);
}

type ContactMessage = { name: string; email: string; message: string; locale: string | null; userId: string | null };

/** Emails a contact message to CONTACT_TO_EMAIL, with reply-to set to the sender. */
export async function sendContactEmail(msg: ContactMessage): Promise<void> {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM,
      to: [process.env.CONTACT_TO_EMAIL],
      reply_to: msg.email,
      subject: `Slovko contact: ${msg.name}`,
      text: [
        msg.message,
        "",
        "—",
        `From: ${msg.name} <${msg.email}>`,
        `Language: ${msg.locale ?? "unknown"}`,
        `Account: ${msg.userId ?? "not signed in"}`,
      ].join("\n"),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
