// What A2 must cover (CONTENT-PIPELINE.md, stages 1, 3 and 4). Checked by
// `npm run course:coverage -- a2`, which also verifies every "in" below: the named
// lessons must exist and match the probe. A2 knows A1: its words and points count.
//
// Until the A2 units exist (`units` is empty) each item is placed in a unit
// (`in: ["u5"]`); `--planned` checks a probe against its whole unit. Once a unit's
// lessons are written, replace the unit with the lessons that teach the item.

import { a1 } from "./a1";
import type { Level } from "./types";

const CEFR = "CEFR grid";
const SCALES = "CEFR scales";
const SAS = "SAS A2";
const KVAPIL = "Kvapil 2018";

export const a2: Level = {
  key: "a2",
  name: "A2",
  units: [],
  knows: [a1],
  textbook: {
    title: "Krížom-krážom Slovenčina A2, 2nd edition (2012)",
    inventory: "research/inventory/a2",
    lessons: Array.from({ length: 10 }, (_, i) => ({ lesson: i + 1, unit: i + 1 })),
  },
  sources: {
    [CEFR]:
      "Council of Europe (2001), Common European Framework of Reference for Languages, Table 2: the self-assessment grid, column A2",
    [SCALES]:
      "Council of Europe (2001), CEFR ch. 4.4–4.5, the illustrative scales at A2 (Conversation, Transactions to obtain goods and services, Listening to announcements, Correspondence, Notes, messages and forms)",
    [SAS]:
      "J. Pekarovičová, Ľ. Žigová, M. Mošaťová (2007), Vzdelávací program Slovenčina ako cudzí jazyk, Studia Academica Slovaca, FiF UK Bratislava, II. stupeň A2 začiatočník (pp. 24–30): the profile, and blocks 1–6 with their situations, skills, grammar and words. The standard the Kvapil 2018 handbook draws on; Kvapil itself covers A1 only",
    [KVAPIL]:
      "R. Kvapil et al. (2018), Slovenčina ako cudzí jazyk: Príručka pre učiteľov, MPC Bratislava, ch. 3.2–3.3: the A1 minimum. Items A1 left open (levels/a1.ts), picked up here",
  },

  // Core words by everyday field, A1's words counted too (A2 knows A1). The fields
  // the A2 standards' situations need: the wider family, feelings and looks, health,
  // travel, lodging, the phone and the post, free time, weather, celebrations,
  // cooking, money, work and studies. The last four are controls, the units' own topics.
  fields: [
    {
      name: "relatives",
      words: "babka dedko vnuk vnučka ujo teta bratranec sesternica synovec neter príbuzný".split(" "),
    },
    {
      name: "feelings and character",
      words: "šťastný nešťastný nahnevaný prekvapený pokojný hanblivý vážny tichý hlučný lenivý pracovitý priateľský tešiť báť".split(" "),
    },
    {
      name: "looks",
      words: "vlasy oči brada okuliare štíhly tučný kučeravý tvár postava".split(" "),
    },
    {
      name: "health and the body",
      words: "hlava krk ruka noha prst chrbát brucho srdce hrdlo zub ucho nos ústa koleno lekár lekáreň liek tabletka recept nemocnica pohotovosť sanitka horúčka kašeľ nádcha chrípka bolieť poisťovňa".split(" "),
    },
    {
      name: "travel and tickets",
      words: "vlak autobus lietadlo letisko stanica nástupište lístok letenka miestenka spiatočný odchod príchod meškať prestupovať batožina kufor pas taxík zastávka cestovať rezervácia".split(" "),
    },
    {
      name: "lodging",
      words: "hotel penzión ubytovanie recepcia jednoposteľový dvojposteľový kľúč raňajky chata stan rezervovať".split(" "),
    },
    {
      name: "phone, post and mail",
      words: "zavolať telefonovať mobil odkaz správa esemeska e-mail list adresa pošta známka pohľadnica obálka balík poslať odpovedať".split(" "),
    },
    {
      name: "free time and sport",
      words: "koníček šport lyžovať korčuľovať bicyklovať plávať turistika výlet výstava múzeum galéria fotografovať šach gitara tancovať".split(" "),
    },
    {
      name: "weather",
      words: "počasie slnko dážď sneh vietor búrka teplota stupeň pršať snežiť fúkať slnečno zamračené oblačno predpoveď dáždnik mráz".split(" "),
    },
    {
      name: "celebrations",
      words: "Vianoce narodeniny meniny sviatok darček oslava Silvester blahoželať želať pozvanie návšteva".split(" "),
    },
    {
      name: "cooking",
      words: "variť piecť recept múka cukor soľ vajce maslo olej cibuľa zákusok koláč".split(" "),
    },
    {
      name: "money and services",
      words: "banka bankomat zmenáreň euro peniaze karta platiť hotovosť účet poplatok".split(" "),
    },
    {
      name: "work and studies",
      words: "práca zamestnanie povolanie plat dovolenka kariéra štúdium skúška štipendium diplom vzdelanie".split(" "),
    },
    {
      name: "Christmas",
      control: true,
      words: "Vianoce stromček darček koleda kapor oplátka betlehem Ježiško Silvester ohňostroj".split(" "),
    },
    {
      name: "Slovakia: nature and sights",
      control: true,
      words: "hory jazero pleso jaskyňa vodopád hrad zámok rieka chata turistika".split(" "),
    },
    {
      name: "festival",
      control: true,
      words: "festival koncert kapela pódium stan spacák vstupenka program".split(" "),
    },
    {
      name: "animals",
      control: true,
      words: "lev tiger slon opica kôň medveď krokodíl žirafa papagáj pes mačka".split(" "),
    },
  ],

  checklist: [
    // ── Grammar: the SAS A2 standard's six blocks, then what A1 left open. The date
    //    (SAS block 3) is A1's (u8-l3), and the past of regular verbs (block 1) too.
    {
      id: "past-irregular", kind: "grammar", source: SAS, item: "Past tense of the modal and irregular verbs (musel, mohol, chcel, išiel, prišiel, jedol), past ↔ present",
      in: ["u2"], probe: "\\bmusel(a|i)?\\b ; \\b(mohol|mohla|mohli)\\b ; \\b(išiel|išla|išli|prišiel|prišla|prišli)\\b",
    },
    {
      id: "comparison-adjectives", kind: "grammar", source: SAS, item: "Comparative and superlative of adjectives, regular and irregular (starší, najlepší, väčší)",
      in: ["u3"], probe: "\\b\\p{L}+(ejší|ejšia|ejšie)\\b ; \\bnaj\\p{L}+(ší|šia|šie)\\b ; \\b(lepší|lepšia|horší|horšia|väčší|väčšia|menší|menšia)\\b",
    },
    {
      id: "comparison-ako-nez", kind: "grammar", source: SAS, item: "Comparing with ako and než (staršia ako ja)",
      in: ["u3"], probe: "\\b\\p{L}+(ší|šia|šie)\\s+(\\p{L}+\\s+)?(ako|než)\\b",
    },
    {
      id: "dative-sg", kind: "grammar", source: SAS, item: "Dative singular of nouns, with adjectives, possessives and ten (môjmu bratovi, tej peknej sestre)",
      in: ["u3"], probe: "\\b(bratovi|otcovi|synovi|kamarátovi|priateľovi|dedkovi|ujovi|Tomášovi|Marekovi)\\b ; \\b(mame|sestre|kamarátke|babke|tete|dcére|Lucii|Emme)\\b ; \\b(môjmu|tvojmu|nášmu|vášmu|svojmu|tomu|mojej|tvojej|našej|vašej|svojej)\\s+\\p{L}+",
    },
    {
      id: "dative-pl", kind: "grammar", source: SAS, item: "Dative plural (rodičom, deťom, kamarátom, sestrám)",
      in: ["u3"], probe: "\\b(rodičom|deťom|kamarátom|priateľom|kolegom|študentom|susedom|ľuďom|sestrám|kamarátkam|priateľkám)\\b",
    },
    {
      id: "dative-pronouns", kind: "grammar", source: SAS, item: "Personal pronouns in the dative, short and long (mi / mne, ti / tebe, mu / jemu, jej, nám, vám, im)",
      in: ["u3"], probe: "\\bmu\\b ; \\bim\\b ; \\bmne\\b|\\bjemu\\b",
    },
    {
      id: "dative-prepositions", kind: "grammar", source: SAS, item: "Prepositions with the dative: k / ku, proti, oproti, vďaka, napriek, kvôli",
      in: ["u3"], probe: "\\b(k|ku)\\s+(\\p{L}+\\s+)?\\p{L}+(ovi|om|ám|e|i)\\b ; \\b(oproti|proti|vďaka|napriek|kvôli)\\b",
    },
    {
      id: "dative-verbs", kind: "grammar", source: SAS, item: "Verbs with a dative: dať, darovať, poslať, pomáhať, telefonovať, blahoželať, ďakovať, páčiť sa",
      in: ["u3"], probe: "\\b(darujem|darujeme|daruje|dám|dáme|dá|pošlem|pošleme|pošle|pomáham|pomáha|pomáhame|telefonujem|blahoželám|gratulujem)\\s+(\\p{L}+\\s+)?(bratovi|otcovi|mame|sestre|rodičom|deťom|kamarátovi|kamarátke|babke|dedkovi|mu|jej|im)\\b",
    },
    {
      id: "adverbs-from-adjectives", kind: "grammar", source: SAS, item: "Adverbs from adjectives (rýchly → rýchlo, dobrý → dobre, pekný → pekne)",
      in: ["u4"], probe: "\\badverb ; \\b(pekne|zle|pomaly|ticho|dlho|draho|lacno|presne|neskoro|pohodlne)\\b",
    },
    {
      id: "comparison-adverbs", kind: "grammar", source: SAS, item: "Comparison of adverbs, regular and irregular (rýchlejšie, lepšie, horšie, viac, menej, najradšej)",
      in: ["u4"], probe: "\\b\\p{L}+ejšie\\b ; \\b(lepšie|horšie|viac|menej|radšej)\\b ; \\bnaj\\p{L}+(ejšie|šie|ej)\\b",
    },
    {
      id: "conditional", kind: "grammar", source: SAS, item: "Present conditional: every person, polite requests and wishes (chcel by som, mohli by ste, išli by sme)",
      in: ["u4"], probe: "\\bby som\\b ; \\bby ste\\b ; \\bby sme\\b|\\bby si\\b",
    },
    {
      id: "relative-ktory", kind: "grammar", source: SAS, item: "Relative clauses with ktorý, ktorá, ktoré, also in other cases (ktorého, ktorú, v ktorom)",
      in: ["u4"], probe: ",\\s*(ktorý|ktorá|ktoré|ktorí)\\b ; \\b(ktorého|ktorú|ktorom|ktorej|ktorým)\\b",
    },
    {
      id: "connectors", kind: "grammar", source: SAS, item: "Linking with ale, alebo, pretože / lebo, preto",
      in: ["u4"], probe: "\\b(pretože|lebo)\\b ; \\bpreto\\b",
    },
    {
      id: "genitive-sg", kind: "grammar", source: SAS, item: "Genitive singular of nouns, with adjectives, possessives and ten",
      in: ["u5"], probe: "\\bgenitive ; \\b(u|od|bez|vedľa|okolo|blízko|z|do)\\s+(\\p{L}+\\s+)?(lekára|lekárky|brata|otca|kamaráta|suseda|mamy|sestry|kamarátky|babky|rodiny|domu|stola|mesta|cukru|mlieka|nemocnice|lekárne)\\b",
    },
    {
      id: "genitive-pl", kind: "grammar", source: SAS, item: "Genitive plural (päť študentov, veľa ľudí, kilo jabĺk, bez detí)",
      in: ["u5"], probe: "\\b(zemiakov|liekov|študentov|kamarátov|priateľov|lekárov|týždňov|mesiacov|ľudí|detí)\\b ; \\b(jabĺk|hrušiek|paradajok|tabletiek|žien|sestier|kamarátok|kníh|izieb|áut|okien|fliaš|dní)\\b",
    },
    {
      id: "genitive-pronouns", kind: "grammar", source: SAS, item: "Personal pronouns in the genitive after prepositions (u mňa, od teba, bez neho, okolo nej, u nás)",
      in: ["u5"], probe: "\\b(u|od|bez|okolo|vedľa|do|z)\\s+(mňa|teba|neho|nej|nás|vás|nich)\\b",
    },
    {
      id: "genitive-prepositions", kind: "grammar", source: SAS, item: "Prepositions with the genitive: z, do, od, bez, u, okolo, vedľa, blízko, počas, podľa, okrem",
      in: ["u5"], probe: "\\bbez\\b ; \\bod\\b ; \\b(okolo|vedľa|blízko|uprostred|počas|podľa|okrem)\\b ; \\bu\\s+\\p{L}{3,}",
    },
    {
      id: "genitive-quantity", kind: "grammar", source: SAS, item: "Genitive after quantities and numbers from five (veľa, málo, kilo, fľaša, päť…)",
      in: ["u5"], probe: "\\b(veľa|málo|kilo|fľaša|fľašu|pohár|šálka|šálku|kúsok|balenie|koľko)\\s+\\p{L}+(y|e|i|u|a|ov|í|iek|ok)\\b ; \\b(päť|šesť|sedem|osem|desať|dvadsať)\\s+(\\p{L}+(ov|í|ok|iek)|jabĺk|kníh|žien)\\b",
    },
    {
      id: "genitive-verbs", kind: "grammar", source: SAS, item: "Verbs with the genitive: opýtať sa (also báť sa, zúčastniť sa)",
      in: ["u5"], probe: "\\bopýta\\p{L}*\\s+sa\\b|\\bsa\\s+opýta\\p{L}*\\b",
    },
    {
      id: "imperative", kind: "grammar", source: `${SAS}; ${KVAPIL}`, item: "Imperative of every verb class, regular and irregular: ty, vy and my forms (zavolaj, zavolajte, poďme), and the negative. A1 has set phrases only",
      in: ["u6"], probe: "\\bimperative ; \\b(zavolaj|zavolajte|napíš|napíšte|povedz|povedzte|daj|dajte|príď|príďte|počkaj|počkajte|urob|urobte)\\b ; \\b(poďme|urobme|zavolajme|napíšme|choďme)\\b",
    },
    {
      id: "pronoun-order", kind: "grammar", source: SAS, item: "Dative and accusative pronouns together, in order (Dám ti ho. Pošlem vám to.)",
      in: ["u6"], probe: "\\b(mi|ti|mu|jej|nám|vám|im)\\s+(ho|ju|ich|to)\\b",
    },
    {
      id: "aspect", kind: "grammar", source: SAS, item: "Verbal aspect: the most frequent pairs (robiť / urobiť, písať / napísať, kupovať / kúpiť) and what each says",
      in: ["u7"], probe: "\\baspect|\\bperfective ; \\burob(iť|ím|íš|í|íme|íte|ia|il|ila|ili)\\b ; \\bnapís(ať|al|ala|ali)\\b|\\bnapíš(em|eš|e|eme|ete|u)\\b",
    },
    {
      id: "future-aspect", kind: "grammar", source: SAS, item: "The future: budem + imperfective against the perfective present (budem písať / napíšem). Builds on A1's u10-budem",
      in: ["u7"], probe: "\\bbud(em|eš|e|eme|ete|ú)\\s+\\p{L}+ť\\b ; \\b(napíšem|urobím|kúpim|zavolám|prečítam|uvarím|navštívim)\\b",
    },
    {
      id: "time-clauses", kind: "grammar", source: SAS, item: "Simple time clauses: keď, kým, až, potom ako, predtým ako",
      in: ["u7"], probe: "\\bkeď\\b ; \\b(kým|až|potom ako|predtým ako|odkedy)\\b",
    },
    {
      id: "adverbs-degree-certainty", kind: "grammar", source: KVAPIL, item: "Adverbs of degree and certainty: dosť, málo, asi, možno, určite, pomaly (A1 left these open)",
      in: ["u4"], probe: "\\bdosť\\b ; \\basi\\b ; \\burčite\\b ; \\bmožno\\b",
    },
    {
      id: "instrumental-means", kind: "grammar", source: KVAPIL, item: "Instrumental for the means and the tool (letím lietadlom, platím kartou, píšem perom) as a rule (A1 left it open)",
      in: ["u4"], probe: "\\binstrumental ; \\b(lietadlom|kartou|perom|taxíkom|autom|mobilom)\\b",
    },

    // ── Situations: the SAS A2 blocks and the CEFR A2 scales.
    {
      id: "studies", kind: "situation", source: SAS, item: "Studying: the study programme, lectures and seminars, exams and credits, the library, studying abroad",
      in: ["u1"], probe: "\\bskúšk ; \\b(kredit|semest|štipendi)",
    },
    {
      id: "family-relatives", kind: "situation", source: SAS, item: "Family and relatives, family relations",
      in: ["u3"], probe: "\\b(babk|dedk|starí rodičia|star(á|ej|ú) mam|star(ý|ého) otc) ; \\b(ujo|uja|tet(a|u|y|e)|bratran|sesternic|synov(e)?c|neter)",
    },
    {
      id: "describing-people", kind: "situation", source: SAS, item: "Describing people: looks and character",
      in: ["u1", "u2"], probe: "\\bvlas|\\boči\\b ; \\b(hanbliv|tich|vážn|leniv|pracovit|priateľsk|temperamentn)(ý|á|é|í)\\b",
    },
    {
      id: "housing", kind: "situation", source: SAS, item: "Housing: describing where you live, a flat ad, renting a room or flat (podnájom, nájomné)",
      in: ["u10"], probe: "\\binzerát ; \\b(podnájom|prenaj|nájomn)",
    },
    {
      id: "celebrations", kind: "situation", source: SAS, item: "Holidays and family celebrations: Christmas, New Year, birthdays and name days, and their customs",
      in: ["u3"], probe: "\\bvianoc|\\bvianočn ; \\bmeniny|\\bmeninám|\\bnarodeniny|\\bnarodeninám",
    },
    {
      id: "congratulating", kind: "situation", source: SAS, item: "Congratulating and wishing, in speech and in a card (želám ti / vám, Veselé Vianoce, Všetko najlepšie k meninám)",
      in: ["u3"], probe: "\\b(želám|želáme|blahoželám|gratulujem|zablahoželať)\\b ; \\b(veselé vianoce|šťastný nový rok|k meninám|k narodeninám)\\b",
    },
    {
      id: "visiting", kind: "situation", source: SAS, item: "A visit: being welcomed and offered food, thanking for the invitation (Vitajte u nás, Ďakujeme za pozvanie)",
      in: ["u3"], probe: "\\bpozvanie\\b ; \\bvitaj(te)?\\s+u\\s+nás\\b",
    },
    {
      id: "feelings", kind: "situation", source: SCALES, item: "Saying how you feel in simple terms: joy, surprise, regret, anger (Teším sa. To je škoda! Som nahnevaná.)",
      in: ["u3"], probe: "\\bteš(ím|íš|í|íme|íte|ia)\\s+sa\\b ; \\b(škoda|ľúto)\\b ; \\b(nahnevan|prekvapen|šťastn)",
    },
    {
      id: "free-time", kind: "situation", source: SAS, item: "Free time: what you like doing most, how you relax, sports and hobbies (rád + verb, najradšej)",
      in: ["u2"], probe: "\\b(rád|rada|radi)\\s+\\p{L}+(m|š|me|te)\\b ; \\bnajradšej\\b ; \\bkoníč|\\bhobby",
    },
    {
      id: "invitations", kind: "situation", source: SCALES, item: "Inviting, suggesting, accepting and refusing (Máš chuť…? Pôjdeš so mnou…? Bohužiaľ nemôžem.)",
      in: ["u2"], probe: "\\bchuť\\b ; \\b(pôjdeš|pôjdete|príď|príďte|poďme)\\b ; \\b(žiaľ|bohužiaľ|nemôžem|nemám čas)\\b",
    },
    {
      id: "tickets", kind: "situation", source: `${SAS}; ${SCALES}`, item: "Buying and reserving tickets: train, bus, plane, city transport (spiatočný, miestenka, letenka)",
      in: ["u4"], probe: "\\blíst(ok|ky|ka) ; \\bspiatočn|\\bjednosmern ; \\bleten|\\bmiesten",
    },
    {
      id: "travel-info", kind: "situation", source: SAS, item: "Asking about a journey: departure and arrival, platform, changing, delays; station and airport signs",
      in: ["u4"], probe: "\\bnástupišt ; \\bprestup|\\bmešk ; \\bodchod|\\bpríchod|\\bodlet|\\bprílet",
    },
    {
      id: "taxi", kind: "situation", source: SAS, item: "Taking or ordering a taxi",
      in: ["u4"], probe: "\\btaxík",
    },
    {
      id: "doctor", kind: "situation", source: SAS, item: "At the doctor's: saying what's wrong, the symptoms, and following the doctor's instructions",
      in: ["u5"], probe: "\\bbol(í|ia) ma\\b ; \\b(horúčk|kaš(eľ|lem|le)|nádch|chrípk) ; \\b(vyzlečte|dýchajte|ukážte|otvorte|ľahnite)\\b",
    },
    {
      id: "pharmacy", kind: "situation", source: SAS, item: "At the pharmacy: buying medicine and how to take it (recept, trikrát denne)",
      in: ["u5"], probe: "\\blekár(eň|ni|ne) ; \\brecept ; \\b(razy|krát) denne\\b|\\bdenne\\b",
    },
    {
      id: "health-system", kind: "situation", source: SAS, item: "Hospital, emergency and insurance: the insurance card, the emergency number",
      in: ["u5"], probe: "\\bnemocnic ; \\bpohotovos|\\bsanitk|\\b112\\b|\\b155\\b ; \\bpoisten|\\bpoisťov",
    },
    {
      id: "telephoning", kind: "situation", source: SAS, item: "Telephoning, formally and informally: asking for someone, being put through, leaving and taking a message, ending the call",
      in: ["u6"], probe: "\\bodkaz ; \\b(prepoj|môžem hovoriť s|zavolajte neskôr|zavolám neskôr) ; \\bdopočutia\\b",
    },
    {
      id: "correspondence", kind: "situation", source: `${SAS}; ${KVAPIL}`, item: "Letters, e-mails and texts: formal and informal openings and closings (Vážená pani, Milý Tomáš, S pozdravom, Pozdravujem). A1 left this open",
      in: ["u6"], probe: "\\bvážen(ý|á|í) ; \\bmil(ý|á|í)\\b ; \\bs pozdravom\\b|\\bpozdravujem\\b",
    },
    {
      id: "post-office", kind: "situation", source: `${SAS}; ${SCALES}`, item: "At the post office: sending a letter or parcel, stamps, the address",
      in: ["u6"], probe: "\\bpošt ; \\bznámk|\\bbalík|\\bobálk ; \\badres",
    },
    {
      id: "address", kind: "situation", source: KVAPIL, item: "Giving your address and writing it on a form or envelope (ulica, číslo, PSČ). A1 left this open",
      in: ["u6"], probe: "\\badres ; \\bul(ica|ici|icu)\\b|\\bpsč\\b|\\bsmerovac",
    },
    {
      id: "hotel", kind: "situation", source: `${SAS}; ${SCALES}`, item: "At a hotel: reserving a room, checking in, asking about breakfast and checking out",
      in: ["u7"], probe: "\\bhotel|\\bpenzión|\\bubytovan ; \\b(jednoposteľ|dvojposteľ|rezerv)",
    },
    {
      id: "money", kind: "situation", source: `${SAS}; ${SCALES}`, item: "Changing money, the bank and the cash machine",
      in: ["u7"], probe: "\\bzmenár|\\bbankomat|\\bvymen(iť|ím|íme)",
    },
    {
      id: "sightseeing", kind: "situation", source: SAS, item: "Sightseeing: tourist information, opening hours and tickets for museums and castles, asking the way in a new town",
      in: ["u7"], probe: "\\bmúze|\\bgalér|\\bhrad ; \\botvoren|\\bvstupn|\\blíst(ok|ky)",
    },
    {
      id: "plans", kind: "situation", source: SAS, item: "Talking about your plans for the coming days, with the future",
      in: ["u7"], probe: "\\bzajtra\\b|\\bbudúc(i|u|om)\\b|\\bcez víkend\\b ; \\b(pôjdem|pôjdeme|navštívim|navštívime|budeme|budem)\\b",
    },
    {
      id: "slovakia-and-home", kind: "situation", source: SAS, item: "Slovakia and your own country: regions, nature, sights, simple facts",
      in: ["u7"], probe: "\\bslovensk ; \\b(hor(y|ách)|hôr|jazer|jaskyn|riek|región|kraj)",
    },
    {
      id: "clothing", kind: "topic", source: KVAPIL, item: "Clothing beyond A1's four words: shoes, coat or jacket, cap, scarf, raincoat (A1 left it open)",
      in: ["u8"], probe: "\\btopánk|\\bčižm ; \\bkabát|\\bbund|\\bpršiplášť ; \\bčiapk|\\bšál\\b|\\bšiltovk",
    },
    {
      id: "media", kind: "topic", source: SAS, item: "The media: magazines and newspapers, a column, a horoscope, a reader poll",
      in: ["u10"], probe: "\\bčasopis|\\btýždenník ; \\bčlán(ok|ku|ky)|\\bhoroskop",
    },
    {
      id: "work-education", kind: "topic", source: CEFR, item: "Your education and your present or last job",
      in: ["u1"], probe: "\\bpracuj(em|eš|e)\\s+ako\\b|\\bpracoval(a)? som\\b ; \\bštudoval(a)? som\\b|\\bvyštudoval|\\bštudujem\\b",
    },

    // ── Can-do statements, CEFR self-assessment grid, A2 (paraphrased), and its scales.
    {
      id: "cefr-listening", kind: "can-do", source: CEFR, item: "Listening: phrases and frequent words about yourself and your family, shopping, where you live, work",
      in: ["u1", "u3"], probe: "\\b(babk|dedk|tet|ujo) ; \\bpracuj",
    },
    {
      id: "cefr-listening-announcements", kind: "can-do", source: `${CEFR}; ${SCALES}`, item: "Listening: the main point of short, clear messages and announcements (at the station, on the phone)",
      in: ["u4", "u6"], probe: "\\bnástupišt ; \\bodkaz",
    },
    {
      id: "cefr-reading-everyday", kind: "can-do", source: CEFR, item: "Reading: specific, predictable information in ads, brochures, menus and timetables",
      in: ["u4", "u7"], probe: "\\bcestovn(ý|om|ého) poriad|\\bodchod ; \\bbrožúr|\\bprospekt|\\binzerát|\\bletá(k|ku)",
    },
    {
      id: "cefr-reading-letters", kind: "can-do", source: CEFR, item: "Reading: short, simple personal letters",
      in: ["u6"], probe: "\\bmil(ý|á)\\b ; \\bpozdravujem\\b",
    },
    {
      id: "cefr-interaction-routine", kind: "can-do", source: CEFR, item: "Interaction: simple routine tasks, a direct exchange of information on familiar topics (a ticket, a doctor's visit)",
      in: ["u4", "u5"], probe: "\\blíst(ok|ky) ; \\bčo (vám|ti) je\\b",
    },
    {
      id: "cefr-interaction-social", kind: "can-do", source: `${CEFR}; ${SCALES}`, item: "Interaction: very short social exchanges: inviting, thanking, apologising",
      in: ["u2", "u3"], probe: "\\bďakuj(em|eme)\\s+(\\p{L}+\\s+)?za\\b ; \\bprepáč",
    },
    {
      id: "cefr-production-people", kind: "can-do", source: CEFR, item: "Production: describe your family and other people, and how you live",
      in: ["u3"], probe: "\\b(babk|dedk|tet|ujo|bratran|sesternic) ; \\bbýv(am|ame|ajú)\\b",
    },
    {
      id: "cefr-production-background", kind: "can-do", source: CEFR, item: "Production: describe your education and your present or most recent job",
      in: ["u1", "u10"], probe: "\\bštudoval|\\bštudujem ; \\bpracuj|\\bpracoval",
    },
    {
      id: "cefr-writing-notes", kind: "can-do", source: `${CEFR}; ${SCALES}`, item: "Writing: short, simple notes and messages (a text, a note left for someone, a message taken on the phone)",
      in: ["u6"], probe: "\\besemesk|\\bsms\\b ; \\bodkaz",
    },
    {
      id: "cefr-writing-letter", kind: "can-do", source: `${CEFR}; ${SCALES}`, item: "Writing: a very simple personal letter, thanking or apologising",
      in: ["u6"], probe: "\\bďakujem\\s+(\\p{L}+\\s+)?za\\b ; \\bpozdravujem\\b|\\bs pozdravom\\b",
    },
    {
      id: "cefr-writing-postcard", kind: "can-do", source: KVAPIL, item: "Writing: a postcard from a trip (Pozdrav z…, Majte sa). A1 left this open",
      in: ["u7"], probe: "\\bpozdrav(y)? z\\b|\\bpohľadnic ; \\bmaj(te)? sa\\b|\\bpozdravuj",
    },
  ],
};
