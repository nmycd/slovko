# Translating the course (Українська, Русский)

Learners choose their native language (uk, en, ru). English lives in the unit
files; Ukrainian and Russian live in catalogs:

```
src/lib/course/translations/uk/unitN.json
src/lib/course/translations/ru/unitN.json
```

Each entry is `"key": { "en": <English source>, "t": <translation> }`.
**Fill in `t` only.** Never edit keys, `en`, or the unit `.ts` files. Slovak
text is not in the catalogs and never changes.

Run `npm run i18n:sync` after the English changes (adds/removes keys), and
check a unit with `npm run -s validate:course -- u3`.

## What the keys mean

Keys look like `u3-l2.5.question` (lesson `u3-l2`, exercise index 5).

| Suffix | What it is | Rules |
| --- | --- | --- |
| `uN.titleEn`, `uN-lM.titleEn` | Unit / lesson title | Short. |
| `uN.topics`, `uN.grammar` | Unit labels (lists) | Same number of items. |
| `.en` | Translation of the Slovak phrase on screen | Natural, not word-for-word. |
| `.note` | Tip under a new phrase | Keep any `**Slovak**` inside as is. |
| `.question` | Question of a multiple-choice exercise | |
| `.options` | Answer options (when they're English) | Same number and **same order**: the correct one stays at its index. |
| `.prompt` | Sentence the learner must write in Slovak | |
| `.answers` | For Slovak→native sentence building: accepted answers | `answers[0]` is split into word tiles, so it must be buildable from its own words. Add natural alternatives (word order, with/without pronoun). |
| `.distractors` | Extra wrong tiles for the above | 1–3 single words, **not** in `answers[0]`, plausibly wrong (wrong case, gender, tense). |
| `.pairs` | Native side of a matching exercise | Same number and order; all unique. |
| `.title`, `.body`, `.table.*`, `.examples` | Grammar card | See below. |

## Adapt, don't calque

Slovak is a close relative of Ukrainian and Russian. Use that:

- **Grammar terms**: use the native names of the cases and categories (table
  below), and point out parallels in one short sentence where they help:
  locative ↔ місцевий / предложный, past tense in -l ↔ -в/-ла / -л/-ла,
  ty/vy ↔ ти/ви / ты/вы.
- **Drop English-specific remarks.** "Slovak has no *a* or *the*" means
  nothing to these learners; drop it or say "as in Ukrainian, there are no
  articles".
- **Pronunciation hints** become easy: č = ч, š = ш, ž = ж, c = ц, ch = х,
  j = й, dz = дз, ľ ≈ ль, ň ≈ нь, ď ≈ дь, ť ≈ ть. Slovak **y and i sound the
  same, like і / и (never ы)**. Slovak **h** is like Ukrainian г (for Russian
  speakers: a soft, breathy г, as in Ukrainian); Slovak **g** = ґ (uk) / г (ru).
  ä ≈ е/э, ô ≈ уо. **Stress is always on the first syllable** (unlike uk/ru).
  Long vowels (á, é, í…) are simply held longer.
- **Formal vs informal** labels: uk «(до «ти»)» / «(до «ви»)»;
  ru «(на «ты»)» / «(на «вы»)».
- Address the learner politely (ви / вы) in explanations, as the app does.

## Grammar cards

- `title`, `body`: rewrite naturally for a Slavic speaker, keeping each card's
  single point. Keep `**…**` around Slovak endings exactly as in the source.
- `table.head`: translate (e.g. "English" → «Українською» / «По-русски»).
- `table.rows`: **Slovak cells stay exactly as they are**; translate only the
  English cells.
- `examples`: translations of the Slovak examples, same order.

## Names and places (use these spellings)

| Slovak | Українська | Русский |
| --- | --- | --- |
| Emma | Емма | Эмма |
| Lucia | Луція | Луция |
| Tomáš | Томаш | Томаш |
| Marek | Марек | Марек |
| pani Horváthová | пані Горватова | госпожа Горватова |
| pán Kováč | пан Ковач | пан Ковач |
| Peter, Jana, Martin, Zuzka | Петер, Яна, Мартін, Зузка | Петер, Яна, Мартин, Зузка |
| Bratislava, Košice | Братислава, Кошиці | Братислава, Кошице |
| Slovensko / slovenčina | Словаччина / словацька | Словакия / словацкий |
| Írsko | Ірландія | Ирландия |

## Terminology

| | Українська | Русский |
| --- | --- | --- |
| noun / adjective / verb / pronoun | іменник / прикметник / дієслово / займенник | существительное / прилагательное / глагол / местоимение |
| ending | закінчення | окончание |
| masculine / feminine / neuter | чоловічий / жіночий / середній рід | мужской / женский / средний род |
| animate | істота (назва істоти) | одушевлённое |
| singular / plural | однина / множина | единственное / множественное число |
| case | відмінок | падеж |
| nominative, genitive, dative, accusative, locative, instrumental | називний, родовий, давальний, знахідний, місцевий, орудний | именительный, родительный, дательный, винительный, предложный, творительный |
| present / past / future | теперішній / минулий / майбутній час | настоящее / прошедшее / будущее время |
| perfective / imperfective | доконаний / недоконаний вид | совершенный / несовершенный вид |
| reflexive verb | зворотне дієслово | возвратный глагол |
| negation | заперечення | отрицание |
| preposition | прийменник | предлог |
| verb group (conjugation type) | дієвідміна (група) | спряжение (группа) |
| long vowel / soft consonant | довгий голосний / м'який приголосний | долгий гласный / мягкий согласный |

## Language quality

- Ukrainian: current standard orthography (проєкт, ґ where due), no
  Russianisms; never ы, э, ъ, ё. Apostrophe as ASCII `'` (м'ясо, п'ять).
- Russian: standard; write ё where it's pronounced (её, всё, ещё); never
  і, ї, є, ґ.
- Keep it short and plain: A1 learners read these between exercises.
