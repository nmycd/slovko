# Debt

What's unfinished, half-done or waiting on someone. Two kinds:

- **Needs the owner:** keys, accounts, payments and decisions that code can't
  do. Each says where to click and what to set.
- **Tech and content debt:** shortcuts in the code or course, and what fixing
  them involves.

Production is https://slovko-eight.vercel.app (Vercel Hobby, deploys every
push to `main`). After changing a Vercel environment variable, redeploy.

## Needs the owner

### High priority

- [ ] **Sign-up emails: set up custom SMTP in Supabase.** The built-in sender
  is meant for testing: it allows only a few auth emails an hour and often
  lands in spam. Real users signing up with email and password may never get
  their confirmation email. Supabase → Project Settings → Authentication → SMTP:
  enable custom SMTP with Resend (or another provider). This needs a verified
  sender domain (see *Domain* below). Until then, Google sign-in avoids the
  problem.
- [ ] **Rotate the Gemini API keys.** Two Gemini keys were pasted into a chat
  on 2026-10-14. In Google AI Studio, delete the unused one (the free-tier key
  starting `AQ.`) and rotate the live one, then update `GEMINI_API_KEY` in
  `.env.local`. It's used only by the local illustration tools, never on Vercel.
- [ ] **Contact form emails (Resend).** Messages are stored in Supabase
  (`contact_messages`); read them in the Supabase table editor. To also get
  each one by email: create a Resend API key, and on Vercel set
  `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (your inbox). Without a verified
  domain, Resend only delivers to your Resend account's own address. Once the
  domain is verified, set `CONTACT_FROM_EMAIL` too.

### Domain and name

- [ ] **Pick and buy a domain.** slovko.com, slovko.app and slovko.sk are taken
  by live sites. As of 2026-10-15 these looked free: learnslovko.com,
  getslovko.com, slovko.io, slovko.co, slovko.org, slovko.net, slovko.cz,
  slovko.eu (.eu needs an EU or EEA registrant).
- [ ] **Check the "Slovko" name before investing in the brand.** slovko.app is
  a Ukrainian-language language-flashcard app, the same space and an audience
  we share; slovko.sk is a Slovak "coming soon" page. Search the EUIPO and the
  Slovak trademark register, and consider renaming while it's cheap.
- [ ] **After the domain:** add it in Vercel; update `NEXT_PUBLIC_SITE_URL`;
  set the Supabase Auth site URL and redirect URLs; move the Stripe webhook to
  the new URL (with its new signing secret); verify the domain in Resend.

### Before taking real money

- [ ] **Leave Vercel Hobby.** Its terms forbid commercial use, so Stripe stays
  in test mode there. Move to Vercel Pro (about $20 a month) or a small droplet
  (about $6 a month, `next start` behind Caddy) before switching on live
  payments.
- [ ] **Stripe live mode:** live keys and prices, plus a live webhook endpoint
  and its secret, all set on the production host.
- [ ] **Legal pages:** privacy policy (we store emails, progress and contact
  messages; EU users), terms of service, and a refund and cancellation policy
  (Stripe expects one). Link them in the footer. Decide on a cookie notice: the
  app only uses its own functional storage today.

### Housekeeping

- [ ] **Supabase redirect URLs:** remove the old trycloudflare.com tunnel
  entries.
- [ ] **Stray test account:** the Google account used in the first Google
  sign-in attempt became a separate free user. Delete it in Supabase → Auth if
  you don't need it. Your main account now has Google linked.
- [ ] **Vercel preview deployments** have no environment variables (only
  Production is set), so branch previews can't sign in or pay. Add Preview
  values if you want previews.

## Tech debt

- **Testing switch:** `NEXT_PUBLIC_UNLOCK_ALL_LESSONS=true` lives in the local
  `.env.development.local`. It opens every lesson, skips Premium, and enables
  `?step=N` deep links. It must never be set on production (it isn't). Delete
  the file when you don't need it.
- **Word-tile clips are checked by machine, not by ear.** Each tile plays its
  word as cut from a take of its own sentence (CONTENT-PIPELINE.md, stage 9,
  "Word tiles"). The script checks that each take's words match its tiles and
  that every clip is long enough and not silent, but nobody has listened to all
  of them. A bad cut can be redone for free with `--recut`; a bad take needs
  voicing again, by deleting it from `takes/` and running the script. Short
  words (je, a, sa, si, o) are said in 0.08–0.15 s; they're slowed to 0.16 s
  (option C), on trial in lessons. The other options, including voicing every
  sentence word by word ($), are in stage 9, "Short words: the options".
- **No automated tests or CI.** Checks are `npm run validate:course`,
  `npm run i18n:sync -- --check`, `npx tsc --noEmit` and `npx eslint src`, all
  run by hand. Worth a small GitHub Actions workflow running those on push.
- **No error tracking or analytics.** Production errors are only visible in
  Vercel's logs. Consider Sentry (or Vercel's own tools) and privacy-friendly
  analytics.
- **Light only.** Dark mode was dropped in the Ivory & Sage redesign, because
  the illustrations blend into a light page. Supporting dark mode would need a
  design for the pictures (a paper card behind them, say). The previous design
  is the git tag `design-classic`.
- **The page is hidden until hydration.** Text stays invisible until the
  client knows the learner's language, so the wrong language never flashes.
  That costs a moment of blank page, and some SEO. The alternative,
  server-side language routing via Accept-Language, was declined for now.
- **Speaking errors are vague.** Any non-JSON reply from `/api/stt` (such as a
  proxy error page) shows "Couldn't reach the server". A clearer split between
  network, server and quota errors would help support.
- **Contact spam protection** is a honeypot field, a minimum fill time and a
  per-IP or per-email rate limit. That's fine at this scale; add Cloudflare
  Turnstile if spam gets through.
- **`editorial-findings.md`** (repo root, uncommitted) is the editorial
  review's working list. All 11 findings are fixed. Delete it or move it into
  docs.
- **Course audio:** clips are pre-generated and cached in Supabase Storage,
  and production never generates new ones (`TTS_LIVE_GENERATION=false`).
  Whenever Slovak text changes, run `npm run generate:audio` (it costs
  ElevenLabs credits) or the browser voice fills in.
- **Translations:** when English course text changes, run `npm run i18n:sync`
  and translate the stale Ukrainian and Russian entries (see
  `src/lib/course/TRANSLATING.md`).

## Content debt

- **Writing lessons are an experiment** (October 2026). Each unit has a writing
  lesson (`uN-pisanie`, before the review lesson) with memorize rounds and most of
  the unit's dictations; standard lessons keep 11 dictations and 24 spelling cards
  (from 104 and 194). To undo it, revert the commit that added it, or check out the
  tag `pre-writing-practice`. Then rerun `npm run plan:spelling`.
- **Native-speaker review in progress.** The A1 course (Slovak, plus the
  Ukrainian, Russian, Uzbek and Georgian versions) was written and proofread by
  AI, plus editorial passes. As of October 2026: English read and fine,
  Ukrainian and Russian under review, Uzbek and Georgian planned. A Slovak
  teacher should still review the Slovak before launch. The landing page's
  teacher quote is a placeholder too.
- **A2, B1 and the driving-exam course** are "coming soon" pages.
- **Illustrations:**
  - **Style references** are pages from Beatrice Alemagna's *On a Magical
    Do-Nothing Day*, a living illustrator. They're fine for exploring a look,
    but before commercial use, build our own style sheet from our renders and
    stop sending her pages (`illustrations/tools/gemini.ts`).
  - **Grammar lessons are mostly unillustrated:** only 6 of 75 grammar cards
    have a picture. One picture per grammar lesson would cost about $1.40, one
    per card about $3.25.
  - **40 exercises reuse an earlier picture.** Unique pictures for them would
    cost about $2.
  - **The illustration plan traces the textbook's situations.** The textbook
    crops stay local and git-ignored, and are never fed to the model. Keep it
    that way.
  - The web pictures (about 18 MB in `public/illustrations`) live in git. Fine
    for now; move them to object storage if the repo gets heavy.
- **Recommended resources:** Reddit couldn't be mined (it blocks automated
  access), so the picks come from university worksheets and film-institute
  lists. Many streaming links only work in Slovakia, and some DVDs are sold
  out. Recheck links now and then.
- **Answer grading** accepts listed answers, with tolerance for missing accents
  and small typos. The idea of an LLM grader for open answers that miss the
  list is not built.
