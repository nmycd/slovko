# Editorial review, step one: find problems, change nothing

Slovko's A1 course has 10 units and 67 lessons. Several authors wrote it in
parallel, and more authors translated it into Ukrainian and Russian, also in
parallel. No author saw anyone else's units. Your job is the one thing they
couldn't do: read the whole course in order, as one reader, and list the
places where that shows.

This step edits nothing. You write a list of findings, and the owner picks
which ones get fixed in a later step.

## What to read

Start with `AUTHORING.md` (the cast and the lesson rules), `TRANSLATING.md`
(names and terms) and `types.ts` (exercise shapes), all in `src/lib/course/`.

Then make three passes, each in course order from unit 1 to unit 10:

1. **English:** `units/unit1.ts` … `unit10.ts`.
2. **Ukrainian:** `translations/uk/unit1.json` … `unit10.json`. Each key holds
   the English source (`en`) and the translation (`t`). The key says where the
   text is: `u3-l1.izba.en` is unit 3, lesson 1, the exercise with id `izba`,
   field `en`.
3. **Russian:** `translations/ru/`, the same way.

Keep running notes outside the repo (in your scratchpad) as you go. For each
lesson, note the rules and terms it taught and the words it introduced. Also
note every fact about a character. This much reading will get your context
compacted, so the notes are your memory. Check them before you call something
a contradiction or a repeat.

## What counts as a finding

Only these:

1. **Wrong.** An error in the Slovak, the English or a translation: grammar,
   meaning, an answer that doesn't match its prompt, or a correct answer the
   exercise wouldn't accept.
2. **Used before taught.** An exercise asks the learner to recognise or
   produce a Slovak word they haven't met yet, in this lesson or an earlier
   one (see "Introduce before you test" in AUTHORING.md). Distractors don't
   count. A new form of a known word counts only if the grammar for that form
   hasn't been taught yet.
3. **Contradiction.** A rule, term or fact stated differently from an earlier
   lesson: another name for the same case, a rule given a different scope, or
   a character's job, home or origin changing.
4. **Taught again as new.** A card explains from scratch something an earlier
   lesson already taught, as if the learner had never seen it. The fix is
   usually to shorten the card. A short pointer back is fine here ("You met
   *ty* and *vy* in unit 1."). This is the only kind of finding where adding a
   pointer back is the fix.
5. **Hard to follow.** Text that a learner would misread or stumble over.
   "I'd phrase it differently" doesn't count.
6. **Inconsistent across units** (translations only). The same term, name or
   form of address is translated differently in different units, or differs
   from what TRANSLATING.md says.

These are **not** findings, so don't list them:

- A card that doesn't mention an earlier unit. Pointing back is never a goal
  on its own.
- Ideas for more examples, more exercises, more reuse of earlier words, or
  new content.
- Rewording a learner wouldn't notice, or matters of style.
- Review lessons repeating earlier sentences. That's what they're for.
- Validator warnings about table cells that mix Slovak and English. They're
  expected.

## How much to expect

Our honest guess is 10–20 findings in English and fewer in each translation.
A short list is a good result, and an empty category is fine. If a language
goes past 30, you're reaching: keep only the 30 that matter most.

## What a fix would cost

Each finding says what its fix would touch, so the owner can weigh it:

- **Changing Slovak text** means new audio (paid TTS credits), and the
  exercise has to be translated again. Propose it only when the Slovak is
  wrong or not yet taught.
- **Changing English text** makes the Ukrainian and Russian versions stale,
  so both get translated again.
- **Changing only a translation** touches nothing else.

## Output

Write `editorial-findings.md` at the repo root. Put a short summary at the
top: the number of findings per language and per kind, and the five you would
fix first. Then add one section per language (English, Ukrainian, Russian),
with the findings in course order. Write each one like this (the example only
shows the format; it isn't a confirmed finding):

```md
### E4 · u2-l2#grammar-ty-or-vy · Taught again as new
**Problem:** The card explains ty/vy from scratch; u1-l4 already taught it, so a learner reads the same lesson twice.
**Fix:** Replace the first body paragraph with: "…" (keep the table).
**Touches:** English, so uk and ru get translated again.
```

Number the findings E1, E2… for English, U1… for Ukrainian and R1… for
Russian. Name the exercise by its id (`u2-l2#grammar-ty-or-vy`), which stays
put when exercises around it change. Quote the current text and give the exact new text, so the fix
step doesn't have to guess.

## Rules

- Don't change any file in the repo except `editorial-findings.md`. Don't
  commit, generate audio or write translations. `npm run i18n:sync -- --check`
  and `npm run -s validate:course` are fine, since they only read.
- You may write throwaway scripts in your scratchpad to list candidates, for
  example Slovak words that appear in an exercise before any card introduces
  them. Read each candidate and judge it before you list it.
- When you're done, reply with the summary and the file's path.
