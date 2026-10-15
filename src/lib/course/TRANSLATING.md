# Translating the course (Українська, Русский, Oʻzbekcha, ქართული)

Learners choose their native language (uk, en, ru, uz, ka). English lives in the
unit files; the other languages live in catalogs:

```
src/lib/course/translations/<uk|ru|uz|ka>/unitN.json
```

The interface strings (buttons, menus, the landing page) are separate:
`src/lib/i18n/messages/<locale>.ts`, same conventions.

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
| `.distractors` | Extra wrong tiles for the above | 1–3 single words, **not** in `answers[0]`, plausibly wrong (wrong case, gender, tense; in Uzbek and Georgian, a wrong ending on the same word works well). |
| `.pairs` | Native side of a matching exercise | Same number and order; all unique. |
| `.title`, `.body`, `.table.*`, `.examples` | Grammar card | See below. |

## Adapt, don't calque

Translate what the English *means for the learner*, not its words. Ukrainian and
Russian speakers get help from Slavic parallels; Uzbek and Georgian speakers
don't, so their versions explain more plainly.

### Ukrainian and Russian

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

### Uzbek and Georgian

Translate from the English, for a learner with no Slavic background. Many will
know Russian, but never rely on it: every explanation must make sense without it.

- **Grammar the learner's language lacks**, explain in plain words, as the
  English does: grammatical gender (neither language has it), prepositions
  (Uzbek and Georgian mostly use endings and postpositions), verb aspect.
  Where it helps, point to a real parallel in one short sentence: Slovak cases
  ↔ Uzbek kelishiklar / Georgian ბრუნვები (both languages have cases too), ty/vy
  ↔ sen/siz / შენ/თქვენ, no articles in Slovak ↔ none in Uzbek or Georgian either.
- **Case names**: use the Slovak name (nominatív, genitív, datív, akuzatív,
  lokál, inštrumentál), with the native term in brackets the first time a card
  mentions it (table below). Slovak textbooks and teachers use these names.
- **Drop English-specific remarks** ("unlike English *the*", "sounds like *ch* in
  *loch*") and say the equivalent for this learner.
- **Pronunciation hints**:
  - Uzbek: č = ch, š = sh, ž = j (as in *jurnal*), c = ts, ch = x, j = y,
    dz = dz, dž = j (as in *jon*), h = h. ľ, ň, ď, ť are soft: l, n, d, t
    with the tongue raised, as if a short *y* followed. Slovak **y and i sound
    the same** (i). ä ≈ e, ô ≈ uo.
  - Georgian: č = ჩ, š = შ, ž = ჟ, c = ც, ch = ხ, j = ი as a glide (like the
    end of *ai*), dz = ძ, dž = ჯ, h = ჰ, g = გ. ľ, ň, ď, ť are soft: ლ, ნ, დ, ტ
    with a short ი glide after. Slovak **y and i sound the same** (ი). ä ≈ ე,
    ô ≈ უო.
  - Both: **stress is always on the first syllable** (Uzbek usually stresses the
    last one), and long vowels (á, é, í…) are simply held longer.
- **Formal vs informal** labels: uz "(sen)" / "(siz)"; ka „(შენ)“ / „(თქვენ)“.
- Address the learner politely (siz / თქვენ) in explanations, as the app does.

## Grammar cards

- `title`, `body`: rewrite naturally for a Slavic speaker, keeping each card's
  single point. Keep `**…**` around Slovak endings exactly as in the source.
- `table.head`: translate (e.g. "English" → «Українською» / «По-русски» /
  "Oʻzbekcha" / „ქართულად“).
- `table.rows`: **Slovak cells stay exactly as they are**; translate only the
  English cells.
- `examples`: translations of the Slovak examples, same order.

## Names and places (use these spellings)

| Slovak | Українська | Русский | Oʻzbekcha | ქართული |
| --- | --- | --- | --- | --- |
| Emma | Емма | Эмма | Emma | ემა |
| Lucia | Луція | Луция | Lusiya | ლუცია |
| Tomáš | Томаш | Томаш | Tomash | ტომაში |
| Marek | Марек | Марек | Marek | მარეკი |
| pani Horváthová | пані Горватова | госпожа Горватова | Horvatova xonim | ქალბატონი ჰორვატოვა |
| pán Kováč | пан Ковач | пан Ковач | janob Kovach | ბატონი კოვაჩი |
| Peter, Jana, Martin, Zuzka | Петер, Яна, Мартін, Зузка | Петер, Яна, Мартин, Зузка | Peter, Yana, Martin, Zuzka | პეტერი, იანა, მარტინი, ზუზკა |
| Bratislava, Košice | Братислава, Кошиці | Братислава, Кошице | Bratislava, Koshitse | ბრატისლავა, კოშიცე |
| Slovensko / slovenčina | Словаччина / словацька | Словакия / словацкий | Slovakiya / slovak tili | სლოვაკეთი / სლოვაკური |
| Írsko | Ірландія | Ирландия | Irlandiya | ირლანდია |

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

| | Oʻzbekcha | ქართული |
| --- | --- | --- |
| noun / adjective / verb / pronoun | ot / sifat / feʼl / olmosh | არსებითი სახელი / ზედსართავი სახელი / ზმნა / ნაცვალსახელი |
| ending | qoʻshimcha | დაბოლოება |
| masculine / feminine / neuter | erkak / ayol / oʻrta jins | მამრობითი / მდედრობითი / საშუალო სქესი |
| animate | jonli | სულიერი |
| singular / plural | birlik / koʻplik | მხოლობითი / მრავლობითი რიცხვი |
| case | kelishik | ბრუნვა |
| nominatív, genitív, datív, akuzatív, lokál, inštrumentál (Slovak names, then in brackets) | bosh kelishik, qaratqich kelishigi, joʻnalish kelishigi, tushum kelishigi, oʻrin-payt kelishigi, — (see below) | სახელობითი, ნათესაობითი, მიცემითი, ბრალდებითი, ადგილობითი, მოქმედებითი ბრუნვა |
| present / past / future | hozirgi / oʻtgan / kelasi zamon | აწმყო / წარსული / მომავალი დრო |
| perfective / imperfective | tugallangan / tugallanmagan tur | სრული / უსრული ასპექტი |
| reflexive verb | oʻzlik nisbatidagi feʼl | უკუქცევითი ზმნა |
| negation | inkor | უარყოფა |
| preposition | predlog | წინდებული |
| verb group (conjugation type) | tuslanish turi | უღლების ტიპი |
| long vowel / soft consonant | choʻziq unli / yumshoq undosh | გრძელი ხმოვანი / რბილი თანხმოვანი |

Uzbek has no instrumental case: give inštrumentál alone and explain it by the
meaning "with" (*bilan*).

## Settled renderings: Uzbek

From the single-reader pass over all ten units (October 2026). Keep new text in
line with these; change one only everywhere at once.

| Slovak / English | Oʻzbekcha |
| --- | --- |
| Ahoj! | Salom! / Xayr! |
| Dobrý deň / Dovidenia | Assalomu alaykum. (siz) / Xayr. (siz) |
| Dobré ráno / večer, Dobrú noc | Xayrli tong / Xayrli kech / Xayrli tun |
| Ako sa máš? / Ako sa máte? | Qalaysan? / Qalaysiz? |
| Ďakujem (pekne) | Rahmat (Katta rahmat) |
| Prosím / Prosím? | Iltimos, Arzimaydi / Nima dedingiz? |
| Nech sa páči | Marhamat |
| Prepáčte / Prepáč | Kechirasiz / Kechir |
| Nič sa nestalo | Hech qisi yoʻq |
| Teší ma | Tanishganimdan xursandman |
| Dobrú chuť! | Yoqimli ishtaha! |
| Na zdravie! | Salomatlik uchun! (sneeze: Sogʻ boʻling!) |
| Všetko najlepšie! | Tugʻilgan kuning bilan! |
| Koľko to stojí? | Bu qancha turadi? |
| internát / spálňa / izba | yotoqxona / yotoq xonasi / xona |
| byt / kaviareň / kino | kvartira / kafe / kinoteatr |
| polievka (jesť polievku) | shoʻrva (shoʻrva yemoq) |
| káva / čaj | qahva / choy |
| oslava / darček | bazm / sovgʻa |
| Vianoce | Rojdestvo |
| prednáška / skúška | maʼruza / imtihon |
| porada / stretnutie | yigʻilish / uchrashuv |
| študovať / čítať / učiť sa | oʻqimoq / oʻqimoq / dars qilmoq (a language: oʻrganmoq) |
| tešiť sa na | …ni intiqlik bilan kutmoq |
| dám si X (ordering) | X olaman |
| unit / lesson | N-boʻlim / dars |

- **Labels**: (informal), (friend) → (sen); (polite), (formal) → (siz). Gender:
  speaker (ayol gapiryapti) / (erkak gapiryapti); addressee (ayolga), (erkakka),
  (ayolga, sen); third person u (ayol), uni (erkak); nouns oʻqituvchi (ayol).
- **Case names**: nominatív (bosh kelishik), genitív (qaratqich kelishigi),
  akuzatív (tushum kelishigi), lokál (oʻrin-payt kelishigi), on first mention in a
  card; inštrumentál alone, explained as the «bilan» case.
- **Terms**: erkak / ayol / oʻrta jins (adjectival: erkak jinsidagi); predlog;
  qoʻshimcha; infinitív; tuslanish turi; tugallangan tur; inkor.
- **Names**: janob X / X xonim; Marek is Lusiyaning akasi. Jana is Yana: at the
  start of a sentence put a dash before the predicate ("Yana — oʻqituvchi."), so
  it can't read as *yana* (again).

## Settled renderings: Georgian

From the single-reader pass over all ten units (October 2026). Keep new text in
line with these; change one only everywhere at once.

| Slovak / English | ქართული |
| --- | --- |
| Ahoj! | სალამი! (hello) / კარგად! (bye) |
| Ahojte! | სალამი ყველას! |
| Dobrý deň | გამარჯობათ |
| Dobré ráno / večer, Dobrú noc | დილა / საღამო / ღამე მშვიდობისა |
| Dovidenia | ნახვამდის |
| Ďakujem / Ďakujem pekne / Ďakujem za X | გმადლობთ / დიდი მადლობა / მადლობა X-ისთვის |
| Prosím / Prosím? / „X, prosím“ (ordering) | გთხოვთ, არაფრის / რა ბრძანეთ? / X, თუ შეიძლება |
| Nech sa páči | ინებეთ |
| Prepáčte | უკაცრავად (excuse me) / მაპატიეთ (sorry) |
| Nič sa nestalo | არაუშავს |
| Dobrú chuť! | გემრიელად მიირთვით! |
| Na zdravie! | გაუმარჯოს! (toast) / იცოცხლე! (sneeze) |
| Teší ma / Aj mňa | სასიამოვნოა გაცნობა / ჩემთვისაც |
| Všetko najlepšie! | გილოცავ დაბადების დღეს! |
| Čo si dáte? / Dám si X | რას მიირთმევთ? / X-ს ავიღებ |
| Chutí mi; mať rád; páčiť sa | მომწონს |
| tešiť sa na | მოუთმენლად ლოდინი |
| internát / vrátnica / vrátnik | საერთო საცხოვრებელი / რეცეფცია / კარისკაცი |
| polievka / čašník | წვნიანი / ოფიციანტი |
| porada / stretnutie / pohovor | თათბირი / შეხვედრა / გასაუბრება |
| prednáška | ლექცია (at a conference: მოხსენება) |
| nikdy | არასდროს |
| unit / lesson | თავი (მე-7 თავი) / გაკვეთილი |

- **Case names**: the Slovak name, then the Georgian term in brackets on first
  mention in a card, agreeing with the ending: akuzatív-ში (ბრალდებით ბრუნვაში);
  in "X + akuzatív" the bracket stays nominative (ბრალდებითი ბრუნვა).
- **Endings on Latin words and brands** are hyphenated: ty-ს, sa-თი, Premium-ით.
- **Infinitives** are glossed with the verbal noun: hovoriť (ლაპარაკი),
  volať sa (რქმევა).
- **Terms**: irregular არაწესიერი; perfective სრული ასპექტი; reflexive
  უკუქცევითი; Slovak preposition წინდებული, Georgian postposition თანდებული.
- **Labels**: gender (კაცი) / (ქალი), (ამბობს კაცი / ქალი), (კაცს) / (ქალს),
  adding ", შენ" when informal; formality (შენ) / (თქვენ).
- **Floors** count the Georgian way: prízemie = პირველი სართული, prvé poschodie =
  მეორე სართული (a unit 8 card explains it).

## Language quality

- Ukrainian: current standard orthography (проєкт, ґ where due), no
  Russianisms; never ы, э, ъ, ё. Apostrophe as ASCII `'` (м'ясо, п'ять).
- Russian: standard; write ё where it's pronounced (её, всё, ещё); never
  і, ї, є, ґ.
- Uzbek: standard literary Uzbek in the Latin alphabet; never Cyrillic. Write
  oʻ and gʻ with the turned comma **ʻ** (U+02BB) and the tutuq belgisi with
  **ʼ** (U+02BC): oʻzbek, gʻalaba, maʼno. Not ' or ` or ‘. Quotes «…».
- Georgian: modern standard Georgian in Mkhedruli; no capitals (don't use
  Mtavruli), never Latin transliteration. Quotes „…“.
- Keep it short and plain: A1 learners read these between exercises.
