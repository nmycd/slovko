# Slovko

A Duolingo-style web app for learning Slovak. The course follows the CEFR A1
syllabus order of *Krížom-krážom Slovenčina A1*; the lesson content is
original.

**Stack:** Next.js 16 (App Router, Cache Components) · Tailwind 4 · Supabase
(auth + Postgres) · Stripe (subscriptions) · ElevenLabs (TTS + STT)

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```

Every service is optional locally. With Supabase configured, lessons require
an account (the proxy redirects signed-out visitors to /login); without it the
app runs in guest mode (progress in localStorage). Without ElevenLabs, audio falls back to the
browser's speech synthesis and speaking exercises can be skipped.

## Project layout

| Path | What |
| --- | --- |
| `src/lib/course/` | Course content: one file per unit in `units/`, following Krížom-krážom A1 (Lekcia 1–10). Server-only; the browser receives one lesson at a time. |
| `src/lib/course/translations/` | Ukrainian and Russian versions of every translation and explanation (one JSON catalog per unit and language). |
| `src/lib/i18n/` | Interface strings in uk / en / ru, and the learner's language (device + account). |
| `src/lib/answers.ts` | Answer checking: accent-insensitive typing, typo tolerance, fuzzy matching for speech. |
| `src/components/lesson/` | Lesson player and the exercise types: intro and grammar cards, choice, fill, build, listen, match, speak. |
| `src/components/app-provider.tsx` | Auth session, XP, streak, completed lessons; syncs to Supabase when signed in. |
| `src/app/api/tts` | Course audio, served from the Supabase Storage cache (`npm run generate:audio` fills it). Only course phrases are accepted. |
| `src/app/api/stt` | ElevenLabs speech-to-text (Scribe). Requires sign-in, with hidden per-user and monthly caps (`src/lib/stt-quota.ts`). |
| `src/app/api/stripe/*` | Checkout, customer portal, webhook. |
| `supabase/migrations/` | Database schema with RLS. |

## Native languages

Learners pick Українська, English or Русский: at sign-up, in the footer, or on
their profile. It sets the interface language and the language of every
translation and grammar explanation in the course (the Slovak and its audio
are shared). The choice is stored on the device and, when signed in, in
`profiles.native_language`.

- Interface strings: `src/lib/i18n/messages/{en,uk,ru}.ts` (the type checker
  makes uk and ru define every English key).
- Course: English lives in the unit files; Ukrainian and Russian in
  `src/lib/course/translations/`. See
  [src/lib/course/TRANSLATING.md](src/lib/course/TRANSLATING.md).

## Adding lessons

Read [src/lib/course/AUTHORING.md](src/lib/course/AUTHORING.md) (lesson
structure, exercise rules, grammar cards, the cast, what may and may not be
taken from the textbook). Then check your unit:

```bash
npm run validate:course -- u3   # one unit; omit the argument for the whole course
npm run i18n:sync               # after changing English text: update the uk/ru catalogs
```

The validator also checks the Ukrainian and Russian catalogs: missing or
stale translations (the English changed since) are errors.

Every Slovak string in the course is automatically allowed for TTS.

## Setting up services

### Supabase (accounts + progress)

1. Create a project at supabase.com.
2. Run the files in `supabase/migrations/` in order (`0001_init.sql`, `0002_stt_usage.sql`, `0003_native_language.sql`, `0004_contact_messages.sql`) in the SQL editor.
3. Copy the project URL, publishable key and secret key into `.env.local`.
4. Authentication → URL Configuration: add `http://localhost:3000/auth/callback`
   (and your production URL) to the redirect URLs.
5. Optional: enable the Google provider for "Continue with Google".

### Stripe (Premium subscription)

1. Create a product "Slovko Premium" with a monthly and a yearly recurring price.
   Put the price IDs in `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_YEARLY`, and the
   displayed amounts in `src/lib/plans.ts`.
2. Enable the customer portal (Settings → Billing → Customer portal).
3. Local webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Put the printed `whsec_…` in `STRIPE_WEBHOOK_SECRET`. In production, add an
   endpoint for `checkout.session.completed` and `customer.subscription.*`.

### ElevenLabs (voice)

Set `ELEVENLABS_API_KEY`, and pick a native Slovak voice from the Voice
Library for `ELEVENLABS_VOICE_ID`. Defaults: `eleven_multilingual_v2` for TTS,
`scribe_v2` for STT.

Pre-generate all course audio into Supabase Storage (about 21,000 characters
for the whole course; re-runs only generate new or changed phrases):

```bash
npm run generate:audio -- --dry-run   # what's missing and what it costs
npm run generate:audio -- --prune     # generate, and delete clips no longer used
```

In production set `TTS_LIVE_GENERATION=false` so requests never spend credits.
Speech-to-text is capped per user per day (`STT_DAILY_LIMIT`, default 100) and
for all users per month (`STT_MONTHLY_LIMIT`, default 20,000); past a cap the
learner sees a friendly "try tomorrow" message and can skip the exercise.

### Resend (contact form email, optional)

Messages from `/contact` are stored in the `contact_messages` table (read them
in the Supabase Table Editor). To also get each one by email, create an API key
at resend.com and set `RESEND_API_KEY` and `CONTACT_TO_EMAIL`; replies go
straight to the sender. Until you verify a domain in Resend, mail comes from
`onboarding@resend.dev` and can only go to the address your Resend account was
created with. After verifying one, set `CONTACT_FROM_EMAIL`.

## Known limitations (MVP)

- The landing-page teacher quote is a PLACEHOLDER (`src/lib/endorsement.ts`).
  Replace it with a real teacher, with their written permission, before launch.
- XP and streak are written by the client, so a determined user can
  edit them. Premium status is only written by the Stripe webhook.
- Premium units are gated in the UI only: any signed-in user can open a
  premium lesson's URL directly.
- Speaking checks compare the transcript to the target phrase. Open-ended
  answers will need an LLM grader (planned).
