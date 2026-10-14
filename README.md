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
| `src/lib/course/` | Course content. `units/unit1.ts`, `unit2.ts` are playable; units 3–10 are planned stubs in `index.ts`. |
| `src/lib/answers.ts` | Answer checking: accent-insensitive typing, typo tolerance, fuzzy matching for speech. |
| `src/components/lesson/` | Lesson player and the 7 exercise types (intro, choice, fill, build, listen, match, speak). |
| `src/components/app-provider.tsx` | Auth session, XP, streak, completed lessons; syncs to Supabase when signed in. |
| `src/app/api/tts` | ElevenLabs text-to-speech. Only course phrases are accepted; audio is cached in Supabase Storage. |
| `src/app/api/stt` | ElevenLabs speech-to-text (Scribe). Requires sign-in once Supabase is configured. |
| `src/app/api/stripe/*` | Checkout, customer portal, webhook. |
| `supabase/migrations/` | Database schema with RLS. |

## Adding lessons

Add a `Lesson` to a unit in `src/lib/course/units/`. Exercise types are
defined in `src/lib/course/types.ts`. For a new unit, create `unitN.ts` and
replace its `planned(...)` stub in `src/lib/course/index.ts`. Every Slovak
string automatically becomes allowed for TTS.

## Setting up services

### Supabase (accounts + progress)

1. Create a project at supabase.com.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor.
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

Set `ELEVENLABS_API_KEY`, and pick a voice that sounds natural in Slovak from
the Voice Library for `ELEVENLABS_VOICE_ID`. Defaults: `eleven_multilingual_v2`
for TTS, `scribe_v2` for STT.

## Known limitations (MVP)

- XP and streak are written by the client, so a determined user can
  edit them. Premium status is only written by the Stripe webhook.
- Premium units are gated in the UI; their content ships in the client bundle.
- No ElevenLabs usage cap yet (planned: a hidden per-account TTS/STT quota).
  TTS only accepts course phrases and caches them; STT requires sign-in.
- Speaking checks compare the transcript to the target phrase. Open-ended
  answers will need an LLM grader (planned).
