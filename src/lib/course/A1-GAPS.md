# A1 coverage gaps

What the live A1 course still leaves out, found by the coverage gate and its
review on 2026-10-16 ([CONTENT-PIPELINE.md](../../../CONTENT-PIPELINE.md),
stages 3 and 4a). A snapshot: `npm run -s course:coverage` is the live view (its
textbook parts need the local inventory in `research/`).

- **Ids** like `L5.g34` name a point of textbook lesson 5 (g grammar, s
  situation, f function, p pronunciation) in the local inventory; lesson N is
  unit N. The same notes are in `research/comparison/kk1/decisions.tsv`.
- **Importance at A1:** high = needed in the first weeks, medium = expected at
  A1, low = breadth. **False finds** are points the gate matched that the course
  doesn't actually teach (a word only in a note, half a function).
- **Fix notes** are the reviewer's suggestion. Pin one lesson per fix before
  writing, and keep lessons at 18 exercises or fewer.
- **When one is closed:** delete its line here and its row in `decisions.tsv`
  (or set it to `taught`), and rerun the gate.

| | Count |
| --- | --- |
| High | 0 (the six were added in 54f3281) |
| Medium | 43 |
| Low | 100 |
| False finds | 34 |
| Word fields under 70 % | 5 |
| Checklist items open | 7 |
| Skips proposed by the review, for the owner to confirm | 49 (in `decisions.tsv`) |

## Word fields under 70 % (whole course)

- **people around you** 1/7: priateľ, priateľka, kolega, kolegyňa, sused, chlapec
- **fruit, vegetables, basic food** 15/24: pomaranč (mentioned in u5-obchod), hruška (mentioned in u5-obchod), jahoda, hrozno, mrkva, paprika (mentioned in u5-obchod), uhorka, cukor, soľ
- **shops and paying** 10/16: potraviny (mentioned in u5-l1), drogéria (mentioned in u5-obchod), pokladňa (mentioned in u5-obchod), cena, nakupovať, peniaze
- **clothes** 5/14: šaty, pulóver, kabát, topánka, ponožka, čiapka, šál, blúzka, oblek (mentioned in u5-l3)
- **countries and languages** 9/15: Česko, Maďarsko, Rakúsko, Francúzsko, angličtina, nemčina

## Outside-standard checklist items still open

From [levels/a1.ts](levels/a1.ts) (CEFR grid, Kvapil et al. 2018).

- **imperative** (u3-l5, u4-l2, u9-l5): Imperative, 2nd person singular and plural (A1.2). Set phrases only (Poďte ďalej, Choďte rovno, Vypíšte); no card on how the form is made. A recognition card would do.
- **instrumental-bare** (u6-l4): Instrumental without a preposition: transport and tools. Transport only (Idem vlakom). The tool (píšem perom, platím kartou as a rule) has no card.
- **adverbs** (u1-l6, u6-l6): Adverbs: trochu, dosť, málo, veľa; určite, možno, asi; rýchlo, pomaly. trochu in one exercise; určite and možno only in an intro note (u6-l6); veľa only in a birthday wish. No dosť, málo, asi, pomaly.
- **private-letters** (u8): Private letters and messages. No letter or e-mail formulas (Milý…/Milá…, S pozdravom, Pozdravujem). Planned for u8, where the textbook has a cover letter.
- **clothing** (u5-l3): Clothing. One lesson with tričko, sveter, košeľa, sukňa; no shoes, coat, jumper, dress, cap (core clothes words 5/14).
- **cefr-writing-postcard** (u5-l6): Writing: a short postcard or greeting. Birthday wishes only; no holiday greeting or postcard formulas (Pozdrav z …, Pozdravujem).
- **cefr-writing-form** (u9-l5, u2-telefon): Writing: a form with name, nationality, address, phone. No word for address (adresa) and no way to give one.

## Textbook points, by unit

### Unit 1

**Medium**

- `L1.f8` Wish someone a nice day: Pekný deň. New. No Pekný deň (or víkend, večer) anywhere; it is the everyday parting line in shops and offices. Fix: in u1-l4 next to Aj tebe / Aj vám, 1 intro + 1 fill answered with Aj vám (~2).
- `L1.s18` Parting with a wish for a nice day and returning it. New; same as L1.f8. The return (u1-l4 "Aj tebe." / "Aj vám.") is taught, the wish isn't.

**Low**

- `L1.f11` Wish someone a good trip: Šťastnú cestu. New. No Šťastnú / Dobrú cestu anywhere. Fix: 1 intro + 1 choice in u6-l4 (travel), which also clears L1.s2.
- `L1.f17` Let someone go first: Nech sa páči (after you). New. Letting someone go first is only in the English note of the u1-l2 "Nech sa páči." card. Fix: 1 choice in u1-l2 (shared with L1.s3).
- `L1.p10` Syllabic r, ŕ, l, ĺ: words with no vowel (vlk, prst, the tongue twister with strč prst). the A1 comparison §9. Syllabic r/l never mentioned, though the course uses štvrtok (u8-l2), prvý (u2-l6), štvrť (u7-l2). Fix: one row on a u1-l5 card + 1 choice.
- `L1.p16` Exceptions: d, t, n, l stay hard before e / i in loanwords and in ten, tie, teraz, jeden, vtedy. New. u1-l5 says d, t, n, l "usually" sound soft before e, i but gives no exceptions; its own example telefón, plus jeden (u2-l6), ten (u3-l6), teraz (u10-l3), are hard. Fix: one sentence on the mäkčeň card.
- `L1.p17` v is [v] before a vowel but [u] at the end of a syllable or word (dav, dievča, domov). the A1 comparison §9. v = [u] at the end of a syllable never mentioned (domov u6-l4, dievča u2-l3). Fix: one line on a u1-l5 card.
- `L1.s2` Seeing someone off on a train and wishing them a safe journey. New; same as L1.f11. A Šťastnú cestu item in u6-l4, next to "Tomáš cestuje domov vlakom.", clears both.
- `L1.s3` Offering someone a seat. New. Offering a seat is only in the English note of the u1-l2 "Nech sa páči." card; no exercise, no Sadnite si. Fix: 1 choice in u1-l2 (shared with L1.f17).

**False finds**

- `L1.f16` Offer someone a seat. False find: matched the English word "seat" in the note of u1-l2's "Nech sa páči." card. No exercise offers a seat. Low; same fix as L1.s3.
- `L1.p13` Voiced vs voiceless consonant pairs: b / p, z / s, ž / š, g / k, h / ch. False find: matched "After k, g, h, ch the ending is -u" on the u8-l5 locative card. Voicing pairs and final devoicing are never mentioned (chlieb, obchod, z Talianska). Low.
- `L1.p9` Consonant sounds, incl. the single sounds ch, dz, dž. Half taught: matched only "ch is a single letter" (u1-l5). c = [ts], j = [y], h, r and dz/dž are never described; c is the classic misreading for English speakers (noc, Košice). Medium. Fix: 3-4 rows in the u1-l5 mäkčeň table + 1 choice.


### Unit 2

**Medium**

- `L2.f15` Ask what someone studies: Čo študujete?. New. No "Čo študuješ?" and no study subject anywhere in the course (no medicína, ekonómia, informatika…); u2-l4 stops at "Študuješ alebo pracuješ?". Fix: in u2-l4, 1 intro with 3-4 subjects as -u chunks, 1 fill, 1 build (~4).
- `L2.f29` Reassure someone that it does not matter: Nevadí. New. Nevadí / To nie je problém appear nowhere; the course has only Nič sa nestalo for apologies (u1-l2). Fix: in u2-l5 after "Nehovorím po nemecky.", 1 intro + 1 choice (~2).

**Low**

- `L2.f1` Confirm your details are right when registering: Áno, správne. New. správne appears nowhere in the course; confirming your details at a desk is not practised. Fix: 1 choice in u9-l5 (personal-data form).
- `L2.f16` Ask or say in which language someone studies (študovať po anglicky). New. študovať po + language is absent; po + language is taught with hovoriť and rozumieť (u2-l4), and učiť sa + slovenčinu only arrives in u9-l2. Fix: 1 fill in u2-l4, together with L2.f15.
- `L2.f20` Compliment someone's Slovak (you speak good Slovak) and thank for it. New. No compliment on someone's Slovak, and no reply to one (closest: u1-l6 "Hovoríte po slovensky? — Áno, trochu."). Learners hear it often. Fix: 1 intro + 1 choice in u2-l4 (~2).
- `L2.f3` Understand being given a key and a room number. New. kľúč appears nowhere in the course, and no room number is read. Fix: in u3-l1 (internát, vrátnica with pán Kováč), 1 intro with kľúč + izba číslo and 1 choice (~2).
- `L2.f30` Ask someone to wait a moment: Moment…. New. Moment / Moment, prosím appear nowhere. Fix: 1 intro + 1 choice in u2-telefon (~2).
- `L2.f9` Point to things near and far: toto / tamto, tu / tam. New; same as L2.g3 (tamto/tamten and tam missing as pointing words).
- `L2.g27` Hard vs soft consonants (d, t, n, l, k… vs ď, ť, ň, ľ, c, č, ž, š, j) for noun patterns. New. u4-l4 says "-e after a soft sound like ň" and u8-l5 "after soft letters", but no card says which consonants are soft (c, č, ď, dz, dž, j, ľ, ň, š, ť, ž). Fix: one line on the u4-l4 card.
- `L2.g3` Near vs far pointing: toto (+ tu), to, tamto (+ tam). New (also L3.g13). Near toto vs neutral to is taught (u3-l6 "Ktoré okno? – Toto."), tu is common; tamto/tamten never appear and tam only once (u4-l5). Fix: a "over there" column (tamten, tamtá, tamto) on the u3-l6 card + 1 fill.
- `L2.g8` Questions about a third person: Ako sa volá? Odkiaľ je? Čo robí? Koľko má rokov?. New. Only u2-l4 "Ako sa volá?" and u2-l7 "Ako sa volajú?" are asked; Odkiaľ je? / Čo robí? / Koľko má rokov? appear only as statements (u2-pisanie "Tomáš má tridsať rokov."). Fix: 2-3 fills in u2-l7.

**False finds**

- `L2.f24` Form a woman's surname from a man's (-ová / -á). False find: matched the name "pani Horváthová" (u1-l1). The rule is one English note on u4-rodina's "manžel a manželka" card; no exercise forms a woman's surname, and -a → -ová, -ý → -á are absent. Low (the A1 comparison §1 asked for the note).
- `L2.g12` Women's surnames: -ová after a consonant or replacing -a; adjectival -ý → -á. False find, same as L2.f24: matched a name in u1-l1; the -ová rule is only a note in u4-rodina, never practised. Low.
- `L2.g24` Masculine nouns for persons ending in -a (kolega). False find: matched u2-l3 "a consonant means masculine, -a feminine", i.e. the opposite rule. No masculine -a noun in the course (kolega, turista absent). Low; add with kolega (the A1 comparison §1).
- `L2.p1` Capital letter for nationality nouns (Slovák, Nemka) but lower case for languages (implicit). False find: matched u8-l2 "Days of the week are written with a small letter." Nothing says Slovák, Írka take a capital while slovenčina, po slovensky don't. Low.


### Unit 3

**Medium**

- `L3.f16` Say that something does not work or is broken (internet, computer, copier). "It doesn't work / it's broken" is absent: no fungovať, nefunguje or pokazený anywhere in the course. A practical need in a dorm, flat or office. Fix: 2 intro cards + 3 items in u3-l1 or u3-l5; reuse in u9-l3 (computer). New.
- `L3.f4` Name kitchen and household appliances (fridge, cooker, microwave, washing machine). No appliance at all: chladnička, sporák, práčka, mikrovlnka, umývačka and televízor are all absent. u3-l1 names the kitchen but nothing in it. Fix: 4–5 intro cards + a match + 2 fills in u3-l1 (the dorm kitchen) or u3-l5 (the new flat). New.
- `L3.f7` Say whether something is there or not (je tu…? / nie je tu…). The learner can't ask "Is there a … here?" (Je tu…?) or say that one thing isn't there. Only positive Tu sú… (u4-l5) and one plural negative (u8-mnozne). Fix: a card + 3–4 items in u3-l1 or u3-l5 (is there a lift, a fridge, a washing machine). Pairs with L3.f4. New.

**Low**

- `L3.f15` Say a phone is switched on or off, charged or flat. No zapnutý / vypnutý or nabitý / vybitý; mobil appears only in a price fill (u4-l6). Fix: 1 intro + 1 fill in u2-telefon or u3-l4. New.
- `L3.f22` Say whether a flat is rented or your own. prenajatý / vlastný (byt) absent; u3-l5 has drahý / lacný only. Fix: 1 intro + 1 choice in u3-l5. New.
- `L3.g13` Distant demonstrative tamten / tamtá / tamto (that one over there). tamten / tamtá / tamto absent: the u3-l6 card stops at ten / tento. Fix: a "that one over there" column on that table + 1 fill or choice. New; overlaps L2.g3 (toto / tamto).
- `L3.g4` Negative adjectives with the prefix ne- (moderný – nemoderný). No ne- adjective anywhere; ne- is taught only on verbs (u2-l5). Fix: one line on u3-aky-je (ne- makes an opposite: nemoderný, nepríjemný) + 2 fills. New; same point as L10.g26.

**False finds**

- `L3.f5` Name office equipment (computer, printer, copier). Partly false find: computer is taught (u8-l5 "Tomáš sedí pri počítači."; u9-l6 fill), but printer matched only an intro note on vytlačiť (u9-l3), and kopírka is absent. Low: 1 intro + a match pair in u9-l3.
- `L3.s4` A bad day at the office: the internet is down, the computer is slow, the copier is broken. False find: matched "v práci" (u8-l1) and pomalý used of a person (u3-aky-je match). The office-problems situation isn't in the course. Fixing L3.f16 covers it; after that the scene itself could be a skip.


### Unit 4

**Medium**

- `L4.f10` Ask what a place or thing is called (ako sa volá…?). Same as L4.g7: the learner can't ask what a place or thing is called, nor "Ako sa to volá po slovensky?". One fix covers both. New.
- `L4.g7` Ako sa volá…? used for places and things, not only people. "Ako sa volá…?" is used only for people (u1-l3, u2-l4). Never for a place or thing, and the course has no "Ako sa to volá po slovensky?", the learner's way to ask for a word. Fix: 1 intro + 2 items in u4-l1 (asking the name of a bridge or square). Same fix as L4.f10. New.

**Low**

- `L4.f1` Talk about letters, postcards and photos: who wrote them and what is in them. No fotka, pohľadnica or list in the course. The u4-rodina note has Emma showing family photos, but no exercise says what is in a photo. Fix: 1 intro (Na fotke je…) + 2 items in u4-rodina. New; letter formulas are a separate item, the A1 comparison §9.
- `L4.f21` Name nationalities: male and female, singular and plural. As L4.g27: m/f singular taught (u2-l1), plural only Slováci. the A1 comparison §9. One fix covers both.
- `L4.f4` Name countries and their capitals. Countries are taught (u2-l1, seven of them), but no foreign capital appears in its Slovak form (Viedeň, Praha, Budapešť), and the neighbours Česko, Rakúsko, Maďarsko are missing. Countries: the A1 comparison §9; capitals: new. Fix: 1 match in u4-l1.
- `L4.g10` Professions and the verbs for their work, by conjugation class (kuchár – variť, fotograf – fotografovať). No sentence pairs a job with the verb for its work (a cook cooks, a teacher teaches), and predávať is absent from the course. Fix: 2 fills + 1 build in u4-l3 with verbs already taught. New.
- `L4.g13` Feminine forms of professions: -ca → -kyňa (sudca → sudkyňa, sprievodca → sprievodkyňa). (marker missed it) The -ca → -kyňa rule is only in the note on the u4-l3 dôchodca card (dôchodkyňa), with no exercise; the marker lists sudca, sprievodca etc. but not dôchodca. the A1 comparison "What looked like gaps" already rates -kyňa low. Fix: 1 fill in u4-l3.
- `L4.g21` Plural with ô → o in the stem (stôl → stoly, kôš → koše). ô → o in the plural is never shown: stôl is taught (u3-l3) but never stoly. Fix: 1 table row + 1 fill in u4-l4. New.
- `L4.g25` Nouns in -ista take the plural -isti (futbalista → futbalisti, turista → turisti). No -ista noun (turista, futbalista) anywhere, so no -isti plural. Fix: turista → turisti in the u4-l4 people table + 1 fill. New.
- `L4.g27` Nationality nouns in four forms: man, men, woman, women (Slovák, Slováci, Slovenka, Slovenky). Singular m/f is taught (u2-l1: Slovák, Slovenka; Nemec, Nemka; Talian, Talianka). Plural only Slováci (u4-l4); Slovenky appears only as a distractor. the A1 comparison §9 (nationalities). Fix: a 4-column table in u4-l4 + 2 fills (Nemci, Slovenky).
- `L4.g31` Plural question words akí? (masculine persons) / aké? (others). akí? appears once, as the prompt of a choice (u4-l4 "Akí sú Marek a Peter?"); aké sú? never appears; no card line. the A1 comparison §5's fix names "Akí sú…?". Fix: add the pair to the u4-l4 cards + 2 fills or a build.
- `L4.g43` Fixed imperatives: pozri!, ukáž!, poď sem!. Poď / Poďte ďalej (u3-l5) and Choď / Choďte (u4-l2) are taught; pozri / pozrite (look!) and ukáž (show me) are absent. Related to the A1 comparison blind spot 4 and the open checklist item "imperative". Fix: 2 intro cards in u4-rodina (looking at photos).

**False finds**

- `L4.f23` Ask what people or things are like in the plural (akí / aké sú…?). False find: the only match is the choice prompt "Akí sú Marek a Peter?" (u4-l4); the learner never asks akí / aké sú. Low; see L4.g31.
- `L4.f26` Ask and say how many people or things there are. False find: matched "Koľko máš rokov?" (u2-l6, age). Saying how many is taught (u4-l5 "Tu sú štyri mosty."), but asking how many people or things (koľko + plural) is not. Low.


### Unit 5

**Medium**

- `L5.f18` Describe what someone is wearing. the A1 comparison Numbers only (clothes field 5/14), not a ranked gap. Clothes + colours taught (u5-l3 "Emma hľadá zelené tričko."), but nothing says what someone is wearing. Fix: 1 card (má na sebe / nosí) + 3 items in u5-l3.
- `L5.f38` Say you know a person or a place (poznať). the A1 comparison §9. poznať absent (see L5.g38): learners can't say Poznáš Tomáša? / Poznám Bratislavu. Same fix as L5.g38.
- `L5.g34` mať + infinitive meaning 'be supposed to, should' (mám kúpiť?). new. mať + infinitive ("am I supposed to…?") is absent from the course: no Čo mám robiť? / Mám kúpiť chlieb? Fix: 1 card + 3 items in u5-l5 next to the modals.
- `L5.g38` poznať (know a person or place) vs vedieť (know a fact, vie, že …). the A1 comparison §9 (rated medium-low there). poznať is absent from the course entirely; vedieť only + infinitive (u5-l5 "Viem variť."), never viem, že / neviem, kde. Fix: 1 contrast card + 4 items in u5-l5.
- `L5.g39` mať oblečené + accusative: say what someone has on. the A1 comparison Numbers only (clothes field 5/14), not a ranked gap. No má na sebe / má oblečené / nosí anywhere. Same gap and fix as L5.f18.

**Low**

- `L5.f12` Wish someone a nice day and return the wish (aj vám). new. Returning a wish is taught (u1-l4 "Ďakujem, aj vám"; u1-l6 "Aj tebe"), but no leave-taking wish (Pekný deň!) anywhere. Fix: 1 intro + 1 choice at the end of u5-obchod.
- `L5.f13` Talk about special offers and sales. new. No akcia / zľava / v akcii anywhere; cheap and expensive are taught (u3-l5, u4-l6 "Tie nohavice sú drahé."). Fix: 1 intro card in u5-obchod.
- `L5.f27` Ask where to put something (kam + položiť / dať). the A1 comparison §9 (Kam? + acc vs Kde? + instr). No kam? with položiť/dať; kam only with ísť (u5-l5 "Kam ideš, Emma?").
- `L5.g25` Time with za vs o + accusative: za hodinu (within an hour) vs o hodinu (an hour from now, later by). new. o + time taught (u5-l6 "Kedy prídeš? — O hodinu."; u9-l2 "Vrátim sa o hodinu."); za hodinu (within an hour) absent, so no za/o contrast. Fix: 1 card line + 1 choice in u5-l6.
- `L5.g3` odísť (leave): full present tense (odídem … odídu). new. odísť is absent from the course (no odídem, no odchádzať); leaving is covered only by "Musím ísť." (u5-l5). Fix: 1 card + 2 items in u5-l5 or u5-l6.
- `L5.g5` Adjectives formed from nouns with -ový / -ová / -ové (jahodový, banánový, zeleninový). the A1 comparison §2 (listed among the textbook L5 contents, left out of the u5-obchod fix). No -ový adjectives anywhere (pomarančový džús, zeleninová polievka). Fix: 1 card + 2 items in u5-obchod or u6-l1.
- `L5.g6` Colour adjectives: the set of eleven basic colours (hnedý, ružový, sivý, fialový, oranžový …). new. 6 colours taught (u5-l3: "červený, modrý, zelený", "biely, čierny, žltý"); hnedý, sivý, ružový, oranžový, fialový are absent from the course. Fix: 1 intro + a match in u5-l3.
- `L5.g7` Light and dark shades: svetlý / tmavý and one-word compounds (svetlomodrý, tmavozelený). new. svetlý/tmavý taught only for rooms (u3-l5: "Chodba je tmavá."), never as colour shades; no svetlomodrý/tmavomodrý. Fix: a note + 1 item in u5-l3.

**False finds**

- `L5.f11` Find the till by following directions. Half: vľavo/vpravo taught (u3-l3), but pokladňa is only in an English note (u5-obchod) and never practised with directions. Low.
- `L5.f17` Describe colours and light or dark shades. Half: colours taught (u5-l3), but the shades half matched svetlý/tmavý as a bright/dark room (u3-l5), never a colour shade. Same gap as L5.g7. Low.
- `L5.f23` Turn down alcohol because you are driving. False find: matched "Emma nikdy nepije kávu." (u8-l4) and šofér as a job (u4-l3). Declining alcohol because you drive is absent; could be skip (party scene).
- `L5.f28` Tell someone where to put something (pod / nad / pred / za / medzi / na + accusative). False find: matched "Dám si polievku." (u6-l2, ordering) and "nesie polievku na stôl" (u6-l6). No placement instructions taught. the A1 comparison §9.
- `L5.f9` Ask whether an item also comes in another colour (nemáte aj + colour?). False find: matched "Akú farbu máš rada?" (u5-l3), a question about likes. No item asks a shop for another colour; the pieces exist (u5-obchod "Máte čerstvú zeleninu?"). Low.
- `L5.g23` Direction with nad, pod, pred, za, medzi, na + accusative: kam? (pod stôl, na kreslo). False find: matched only the u6-l6 fill "Marek nesie polievku na stôl." (the blank is the verb). No kam? + accusative with nad/pod/pred/za/medzi anywhere; "pod stôl" is only a wrong option in u6-l7. the A1 comparison §9.


### Unit 6

**Medium**

- `L6.f3` Accept an invitation with certainty (určite / rád prídem). the A1 comparison §9 covers only the certainty words. Invite, thank and decline are taught (u6-l6, u5-l6), accepting isn't: no Áno, rád prídem / Určite prídem. Fix: 1 card + 2 items in u6-l6.
- `L6.f39` Say how long ago something happened (pred + instrumental). new. Same as L6.g25.
- `L6.g25` Time with pred + instrumental: ago (pred minútou, pred rokom). new. No pred + instrumental for "ago" (pred rokom, pred týždňom) anywhere, though the past tense starts in u7-l5. Fix: 1 card + 3 items in u7-l5 (or u8-rok).

**Low**

- `L6.f10` Read a menu: the courses (aperitif, starter, soup, main course, dessert). new. polievka and hlavné jedlo taught (u6-l1); no predjedlo or dezert/zákusok. Fix: 1 intro card in u6-l1.
- `L6.f12` Read a menu: side dishes, vegetarian dishes, pasta and salads. new. Sides taught (u6-l1 ryža, hranolky; príloha in a note); no šalát, cestoviny or vegetariánsky. Fix: 1 intro + 1 item in u6-l1.
- `L6.f24` Describe how food is prepared (boiled, roast, fried, grilled). new. No way to say how food is cooked (varené, pečené, vyprážané); the u6-l1 menu has five items. Fix: 1 card + 2 items in u6-l1.
- `L6.f31` Leave a tip. new. No tipping phrase (sprepitné; to je v poriadku = keep the change); v poriadku is absent from the whole course. Fix: 1 intro in u6-l4.
- `L6.f36` Say what you use to do something (write with a pen, wash with water). the A1 comparison §9. Same as L6.g18: no čím píšeš? / tool instrumental; only transport and kartou.
- `L6.f4` Give a hedged answer (možno / asi prídem). the A1 comparison §9. možno only in an English note (u6-l6), asi absent. Same fix as L6.f3.
- `L6.f40` Say that something falls between two dates or times (medzi + instrumental). new. Same as L6.g26.
- `L6.f9` Name places to eat and drink and say where you can eat. new. kaviareň (u4-l2) and reštaurácia (u8-l5, u10-l3) are used; no cukráreň, jedáleň (canteen) or bar. Fix: 1 intro + a match in u6-l1.
- `L6.g10` How food is prepared: varený, pečený, vyprážaný, opekaný, grilovaný. new. No varený / pečený / vyprážaný / grilovaný anywhere. Same fix as L6.f24.
- `L6.g18` Instrumental of the tool or means: písať perom, umývať sa mydlom, česať sa hrebeňom. the A1 comparison §9. Means without a preposition taught only for transport (u6-l4) and paying (u6-l7 "Môžem platiť kartou?"); no tool (perom, vodou, mydlom).
- `L6.g26` Time with medzi + instrumental: between two dates or times (medzi aprílom a júnom). new. medzi taught only for place (u6-l5 "Kaviareň je medzi bankou a poštou."), never between two times or months.
- `L6.g27` Accusative (kam?) vs instrumental (kde?) after the same prepositions (pod stôl vs pod stolom). the A1 comparison §9. Only the kde? side taught (u6-l5 "Mačka je pod posteľou."); the kam? form "pod stôl" appears only as a wrong option in u6-l7.
- `L6.g5` želať si and prosiť si as equivalents of priať si when ordering. new. prosiť si taught (u5-obchod "Prosím si dve jablká." + fill); Čo si prajete? only in a u6-l2 note, želať si absent. Fix: 1 choice in u6-l2 to recognise Čo si prajete? / Čo si želáte?

**False finds**

- `L6.f13` Write a menu with courses and prices. False find: matched "jedálny lístok" (u6-l1) and euro prices (u4-l6) separately; nothing reads or writes a menu with prices. Could be skip (a writing task).
- `L6.f26` Complain about food or drink in a restaurant. False find: matched "Aké je auto? – Je staré." (u3-l2) and "Prepáčte!" (u1-l2). The only food complaint is one u6-l7 choice ("Polievka je veľmi slaná."), comprehension only. Low.
- `L6.f33` Call a taxi by phone, giving an address and a name. False find: matched taxík (u6-l4) and ulica in a u8-l5 table; no phone call to order a taxi, no address given. Low; could be skip (book scene).
- `L6.g2` Degrees of certainty: určite (for sure), možno / asi (maybe), určite nie. False find: určite and možno appear only in the English note of the u6-l6 card "Ďakujem za pozvanie."; no exercise; asi absent. the A1 comparison §9.


### Unit 7

**Medium**

- `L7.f19` Say you are sorry about something (mrzí ma to, je mi to ľúto). the A1 comparison §9. mrzieť / ľúto absent; the course has only "To sa stáva" (u7-l1) and "Prepáčte".
- `L7.f3` Tell the time formally: 24-hour clock (štrnásť hodín, o dvadsiatej). the A1 comparison §9. Same as L7.g19: no 24-hour clock.
- `L7.f4` Tell the time to the minute. the A1 comparison §9. Same as L7.g20: no minutes.
- `L7.f8` Say from when to when something takes place (od … do). the A1 comparison §9. Same as L7.g15 (od … do).
- `L7.g15` Time span: od … do (from … to) with clock times, and trvať (to last). the A1 comparison §9. No od … do with clock times (opening hours, class times) and no trvať anywhere.
- `L7.g19` Formal 24-hour time vs informal 12-hour time with a part of the day (osem hodín večer). the A1 comparison §9. No 24-hour time (o pätnástej, štrnásť hodín); u7-l2 stops at dvanásť.
- `L7.g20` Time with minutes: osem dvadsať; formal o ôsmej hodine a dvadsiatej minúte. the A1 comparison §9. No minutes past the hour; only pol / štvrť na / trištvrte na (u7-l2, u7-l7).
- `L7.g35` Modal verbs in the past: mohol, smel, mal, musel, chcel, vedel. new. mohol, chcel taught (u10-l4 table, match, "Tomáš nemohol prísť."), mal in u10-l4 "Nemala som čas."; musel and vedel never appear, so "had to" can't be said. The u7-l5 -ieť → -el rule covers them but no item uses them.
- `L7.g4` začínať sa / končiť sa: say when something starts and when it ends. new. Only one example on the u8-l2 months card ("V septembri začína škola."); končiť / skončiť absent; no item asks or says when something starts or ends.

**Low**

- `L7.f18` Decline with regret: unfortunately, maybe next time (bohužiaľ, nabudúce). the A1 comparison §9 (regret family; bohužiaľ, nabudúce not named there). Declining is taught bare: u5-l6 "Nemôžem prísť, musím pracovať."
- `L7.f20` React to bad news: what bad luck, what a pity (smola, škoda). the A1 comparison §9. škoda and smola absent.
- `L7.f21` Comfort someone: don't worry (netráp sa). the A1 comparison §9. No comforting phrase anywhere (netráp sa, neboj sa).
- `L7.f26` At the library: borrow books. new. požičať (si) absent; the library is only a place (u7-l1 "Emma je v knižnici, číta knihu."). The verb is also everyday lend / borrow.
- `L7.f30` Talk about the school system and the people in it (pupil, student, teacher, professor). new. No základná / stredná / vysoká škola, no žiak; učiteľ (u2-l3) and študent exist, but nothing on the school levels.
- `L7.f37` Use not even / at least / also (ani, aspoň, aj). the A1 comparison §9. Same as L7.g9.
- `L7.f7` Say roughly when something happens (okolo piatej). the A1 comparison §9. Same as L7.g10.
- `L7.f9` Say how long something lasts (trvať + a length of time). the A1 comparison §9. trvať absent; no how-long question.
- `L7.g10` okolo + clock time: at about (okolo piatej). the A1 comparison §9 (okolo piatej). okolo is absent from the course.
- `L7.g11` Past participles used as adjectives: objednaný, požičaný, vrátený, pokazený. new. No participle used as an adjective anywhere (objednaný, požičaný, pokazený; also zatvorený / otvorený for shops and offices). u9-l3 has only the verbs otvoriť / zatvoriť, for files. Same gap as L8.g6.
- `L7.g34` Past of niesť / viezť: niesol, niesla; viezol, viezla. new. niesť present is taught (u6: nesie, nesú) but niesol / niesla and viezť never appear.
- `L7.g9` ani, aspoň, aj: not even, at least, also. the A1 comparison §9. Neither ani nor aspoň appears anywhere; aj is used but never contrasted.

**False finds**

- `L7.f10` Read a TV programme or a timetable (items at given times). False find: matched the word "rozvrh hodín" (u7-l1) plus any "o deviatej"; no timetable or TV listing is read anywhere, and TV words are absent (only správy, u10-l1). Low: CEFR puts timetables at A2.
- `L7.f27` At the library: return books. Mentioned, not practised: one table cell on u9-l2's sa card ("vrátiť knihu (return a book)"); every exercise there drills vrátiť sa (come back). Low.
- `L7.f28` Make a copy of an article (kopírovať, kopírka). False find: matched u9-l3 "kopírovať a vložiť" (copy and paste on a computer), not photocopying an article. Low.


### Unit 8

**Medium**

- `L8.f20` Ask and say what day it is today or was yesterday. new. No question for the day of the week: u8-l2 has only "Pozajtra je sobota.", and u8-l3's choice offers "What day is it today?" as a wrong answer without ever teaching the Slovak.
- `L8.f8` Cancel, change or postpone an appointment (zrušiť, zmeniť, preložiť termín). new. zrušiť, zmeniť, preložiť, presunúť, termín all absent; u8 teaches porada / stretnutie / pohovor and when they are, but nothing can be cancelled or moved.
- `L8.f9` Book a room or a hotel (rezervovať). new. rezervovať / rezervácia absent everywhere (hotel, table, room).
- `L8.g18` Universal words: každý / všetci, všetko, vždy, všade. the A1 comparison §9 (the all-words). každý, všetci, všade absent; vždy taught (u8-l4); všetko only in set phrases (u5 "Nie, to je všetko.", "Všetko najlepšie!") and as a u8-l4 distractor. Medium: každý deň is core routine language.

**Low**

- `L8.f15` Say something is sold out or taken (vypredaný, obsadený). new. vypredaný, obsadený absent (and voľný for a seat).
- `L8.f16` Say something is cancelled, agreed or postponed (zrušený, dohodnutý, preložený). new. zrušený, dohodnutý, preložený absent; pairs with L8.f8.
- `L8.f26` Ask and say how often one does something (ako často?). new. Half a function: the answers are taught (u8-l4 card, "Marek doma málokedy varí."), but the question ako často never appears (the card's title is English).
- `L8.f31` Give a short career summary in the past (worked as …, studied …). new. Parts exist (u2-l4 "Pracuješ ako programátor?", u7-l5 past) and Emma's CV line is read in u8-l7; no item says what one worked as or studied.
- `L8.f34` Write a short cover letter (replying to an offer, enclosing a CV, closing formula). the A1 comparison §9 (letter formulas). No S pozdravom, no reply-to-an-offer phrase.
- `L8.g10` Adjectives from seasons, months and days (letný, januárový, pondelkový / pondelňajší). the A1 comparison §8 (seasons with their adjectives). No letný, zimný, januárový, pondelkový anywhere.
- `L8.g13` Time adjectives dnešný / včerajší / zajtrajší agreeing with the noun. new. dnešný / včerajší / zajtrajší absent.
- `L8.g15` Date ranges: od + date do + date. the A1 comparison §9 (od … do, named there for clock times). No date range anywhere.
- `L8.g27` po + locative: moving around a place, and after an event (po parku, po práci). new. po + time taught (u8-l6 "Po obede mám pohovor."); po + place, moving around (po meste, po parku), absent.
- `L8.g30` v meste vs na dedine (in town vs in the village). new. dedina is taught (u4-l1) but never with na: no na dedine; v meste only in the u8-l5 table.
- `L8.g4` trvať + a length of time (lasts two hours; lasted until …). the A1 comparison §9. trvať absent (same as L7.f9).
- `L8.g6` Past participles as adjectives: vypredaný, zrušený, obsadený, dohodnutý, preložený. new. Same as L7.g11: no participle adjectives (vypredaný, obsadený, zrušený, dohodnutý).

**False finds**

- `L8.f22` Refer to the day before yesterday and the day after tomorrow (predvčerom, pozajtra). Mentioned, not practised: predvčerom appears only in the English note on u8-l2's pozajtra card; no exercise uses it (pozajtra is practised). Low.
- `L8.f25` Give the dates of holidays (Christmas, New Year, Easter, name days). False find: Vianoce (u8-rok "Vianoce sú v zime.", u8-pisanie) and an unrelated ordinal date matched separately; no holiday is ever given a date, and Nový rok, Veľká noc, meniny are absent. Low.


### Unit 9

**Medium**

- `L9.f16` Ask how to do something (Ako môžem …?). No "how do I …?" question: no Ako môžem / Ako sa dá + infinitive, and no "Ako sa povie … po slovensky?". new
- `L9.f18` Check in at a hotel (ubytovať sa). No hotel check-in: hotel only in "Kde je hotel?" (u4-l2 note) and "dva hotely" (u4-l5); no rezervácia, hotel room or ubytovať sa. new
- `L9.f2` Ask and say what to take along on a trip (so sebou, zbaliť). Nothing on taking things along: zobrať (si), vziať, so sebou and zbaliť are all absent course-wide; "take" is an everyday verb. new
- `L9.f24` Give your address: street, town, post code, permanent residence. Half a function: u9-l5 shows the form fields (trvalé bydlisko, ulica, PSČ, mesto; u9-pisanie listen "Aké je vaše trvalé bydlisko?") but has no adresa and no exercise where the learner gives an address. the A1 comparison "What this comparison cannot see" (CEFR form row); checklist cefr-writing-form, open
- `L9.f25` Give your identity card or passport number. No pas or občiansky preukaz anywhere (pas is in the textbook's L3 glossary); offices and hotels ask a foreigner for a passport number. new
- `L9.f3` Talk about money for a trip. peniaze is absent from the whole course (also a core-word miss in "shops and paying"); prices and paying are taught (u4-l6, u5-obchod). new (the A1 comparison §2 names paying, not peniaze)
- `L9.f31` Congratulate someone. No gratulovať / Gratulujem; u5-l6 teaches "Všetko najlepšie!" for birthdays only. new
- `L9.f34` Express regret (je mi ľúto). No regret or sympathy: ľúto, mrzí and škoda are all absent course-wide. the A1 comparison §9
- `L9.f4` Express delight at news (úžasné, skvelé). No reaction to good news: super, skvelé, úžasné absent; výborne only in "Mám sa výborne" (u1-l3). new
- `L9.f43` Agree with someone (súhlasiť). No way to agree: súhlasím, máš pravdu, to je pravda and ja tiež are all absent. new
- `L9.f44` Accept an offer gladly (veľmi rád / s radosťou). Offers of things are taught (u1-l2 "Áno, prosím."), but there is no glad yes to an invitation or proposal (rád prídem, veľmi rád, s radosťou); "Určite" only in a u6-l6 note. new
- `L9.g13` Time ranges with ordinal hours in the genitive: od deviatej do dvanástej. No time ranges od … do with the -ej hour forms (u7-l2 teaches "o ôsmej" only); needed for opening hours. the A1 comparison §9 (od … do)

**Low**

- `L9.f19` Choose an option, e.g. a section or workshop (vybrať si). vybrať si absent (see L9.g6); choosing in a café is covered by "Dám si kávu." (u9-l4) and "Čo si dáte?" (u6-l2). new
- `L9.f21` On a form, give your surname and maiden name. Surname taught (u9-l5 match: meno, priezvisko); maiden name (rodné priezvisko) absent. new
- `L9.f30` Say you are proud of someone (hrdý na). hrdý (proud of) absent. new
- `L9.f32` Say you are counting on someone (počítať s + instrumental). počítať s + instrumental (count on someone) absent; počítať appears only inside počítač. new
- `L9.f36` Say you are stressed. stres absent; u7-l3 has unavený for how you feel. new (the A1 comparison §5 lists moods, not stres)
- `L9.f39` Put the steps of a trip in order: book and pay for a flight, call a taxi, fly. An ordering exercise in the book; letisko, letenka and zarezervovať are absent (letisko is in the textbook's L8 glossary); u9-l4 has "Lucia si zavolala taxík.", u6-l4 lietadlom. new
- `L9.f6` Reassure someone that they will manage (zvládnuť). No reassurance (zvládnuť, neboj sa); only "Nič sa nestalo" after an apology (u1-l2). new
- `L9.f9` Check that the other person is still there (chat or phone). No check that the other person is still on the line; u2-telefon has Haló?, Zavolám ti, Dopočutia. new (the A1 comparison §6 area, fixed without it)
- `L9.g14` Time expressions with na / v + accusative (na druhý deň, v posledný deň, na tri dni). v + accusative of days is taught (u8-l2 "V piatok mám pohovor."); na + a duration (na týždeň, na tri dni) and na druhý deň absent. new
- `L9.g2` sám / sama / samo: 'alone, on one's own', with its gender forms. sám / sama / samo (alone) absent course-wide; "Bývam sama" would fit u3-l1 or u4-rodina. new
- `L9.g25` sa changes the meaning: vydať (hand over) vs. vydať sa (get married). Meaning change with sa is taught in u9-l2 (volať / volať sa, vrátiť / vrátiť sa); vydať sa (get married) absent, though u4-rodina has vydatá. new
- `L9.g27` Always-reflexive verbs: smiať sa, báť sa (bojím sa). No always-reflexive verbs (smiať sa, báť sa); u9-l2 lists only volať sa, mať sa, učiť sa. the A1 comparison §9
- `L9.g3` Reflexive pronoun sebou in so sebou (take something along with you). so sebou absent; tied to L9.f2 (what to take along). new
- `L9.g6` vybrať (si): irregular present vyberiem … vyberú. vybrať (si) absent in every form, so no vyberiem / vyberú; zobrať, same pattern, absent too. new
- `L9.g8` Reflexive possessive svoj (svoja, svoje, so svojimi …) = one's own. svoj absent; the book only glosses it as = môj, and the rule is usually A2. new

**False finds**

- `L9.f26` Tell nationality from citizenship on a form (národnosť / štátna príslušnosť). False find: národnosť is practised (u9-l5 fill "Aká je vaša národnosť?"), but štátna príslušnosť appears only in that card's English note; nothing sets the two apart.
- `L9.f27` Give your phone number and e-mail address. Half a function: the phone number is taught (u2-telefon "Aké máš telefónne číslo?"), but the e-mail hit is "poslať e-mailom" (send by e-mail); no one gives an e-mail address.
- `L9.f40` Discuss what to pack for a trip at different times of year. False find: seasons (u8-l2 "v lete", "v zime") and clothes (u5-l3 sveter, u4-l6 okuliare) sit in different lessons; nothing about packing (see L9.f2).
- `L9.s1` Phone call with a parent about an upcoming trip abroad: dates, packing, money. False find: mama (u4-rodina) and konferencia (u9-l1) in unrelated lessons. The scene itself could be skipped; its can-dos are L9.f1-f3.
- `L9.s5` Checking in at a hotel reception. False find: "Kde je hotel?" (u4-l2 note) and izba (u2-l3, a dorm room); no check-in anywhere (see L9.f18).


### Unit 10

**Medium**

- `L10.f3` Recommend a programme for someone and say why. No way to give a reason: pretože and lebo are absent course-wide (pretože is in the textbook's L8 glossary); odporúčať absent too. new

**Low**

- `L10.f19` Say what your favourite colour is and why. Colour likes are taught (u5-l3 "Akú farbu máš rada?", "Lucia má rada žltú farbu."); obľúbený and a reason with pretože are absent (see L10.f3). new
- `L10.f2` Read a TV listing. Reading a TV listing is breadth, but televízia, pozerať (watch), relácia and seriál are absent course-wide (televízia is in the textbook's L8 glossary); u5-mam-rad has film only. new
- `L10.f5` Say where a region lies using compass points (na severe, na východe). Compass points absent (see L10.g3). the A1 comparison (weather note)
- `L10.f9` Understand 'what's on' tips for the weekend. kino, divadlo and múzeum are taught (u4-l2); koncert, výstava and festival are absent, so an event notice can't be read (koncert is a core-word miss). new
- `L10.g13` Ordering 1–4 items: jednu + feminine accusative, tri / štyri + plural noun. Ordering with numbers is taught (u5-obchod "Prosím si dve jablká."), but jednu (feminine accusative of one) never appears; u2-l6 teaches jeden / jedna / jedno in the nominative only. new
- `L10.g18` Compound colour adjectives (bielo-modro-červený, tmavomodrý). No tmavo- / svetlo- colour compounds and no bielo-modro-červený; svetlý and tmavý exist as adjectives (u3-l6 "Veľký a svetlý."). new
- `L10.g26` ne- forms opposites (praktický → nepraktický, fajčiar → nefajčiar). No ne- adjectives (nepraktický, nezdravý…); ne- is taught for verbs only (u2-l5). new (same point as L3.g4)
- `L10.g27` Times of day: v noci vs. cez deň. ráno and večer are taught (u7-l3 "Ráno vstávam o siedmej."); v noci and cez deň absent (noc only in "Dobrú noc"). new
- `L10.g3` Compass points: sever, juh, západ, východ. No compass points (sever, juh, západ, východ) anywhere. the A1 comparison "What looked like gaps but isn't" (weather: compass points missing, low)
- `L10.g4` Regions named with compass adjectives: západné / stredné / východné Slovensko. No západné / stredné / východné Slovensko; u10-l2 gives the weather by town ("V Košiciach je slnečno."). the A1 comparison (same weather note)

**False finds**

- `L10.f17` Say what colour the rooms in your home are. False find: rooms (u3-l4 "To je naša kuchyňa.") and colours (u5-l3) are never combined; one fill or build would close it. Low priority.
- `L10.f22` Talk about countries and their typical food or drink. False find: "Vitaj na Slovensku!" (u1-l4) and food words (u5-l1) sit in different lessons; no sentence links a country with its food. Low priority.
- `L10.f27` Ask for someone else's opinion. False find: the hit is "Na čo myslíš, Lucia?" (u7-l4: what are you thinking about?); "Čo si myslíš?" is never asked. Giving an opinion is itself only an example on a u9-l4 card.
