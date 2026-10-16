// What A1 must cover (CONTENT-PIPELINE.md, stages 1, 3 and 4). Checked by
// `npm run course:coverage`, which also verifies every "in" below: the named
// lessons must exist and match the probe.

import { unit1 } from "../units/unit1";
import { unit2 } from "../units/unit2";
import { unit3 } from "../units/unit3";
import { unit4 } from "../units/unit4";
import { unit5 } from "../units/unit5";
import { unit6 } from "../units/unit6";
import { unit7 } from "../units/unit7";
import { unit8 } from "../units/unit8";
import { unit9 } from "../units/unit9";
import { unit10 } from "../units/unit10";
import type { Level } from "./types";

const CEFR = "CEFR grid";
const KVAPIL = "Kvapil 2018";

export const a1: Level = {
  key: "a1",
  name: "A1",
  units: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8, unit9, unit10],
  textbook: {
    title: "Krížom-krážom Slovenčina A1, 1st edition (2007)",
    // Made for the A1 comparison, before the research/inventory/<level> convention.
    inventory: "research/comparison/kk1",
    lessons: Array.from({ length: 10 }, (_, i) => ({ lesson: i + 1, unit: i + 1 })),
  },
  sources: {
    [CEFR]:
      "Council of Europe (2001), Common European Framework of Reference for Languages, Table 2: the self-assessment grid, column A1",
    [KVAPIL]:
      "R. Kvapil et al. (2018), Slovenčina ako cudzí jazyk: Príručka pre učiteľov, MPC Bratislava, ch. 3.2–3.3: the A1 grammar and lexical minimum (pp. 28–32), its situations and topics; after the Comenius University standards (Pekarovičová, Žigová, Mošaťová 2007)",
  },

  // Core words by everyday field: the A1 comparison's lists (words from the
  // textbook's glossaries), so the numbers stay comparable, with its "family and
  // people" split in two, family and the people around you, which a family lesson
  // alone doesn't cover. The last four are its controls, the units' own settings.
  // Health and countries were added for its blind spot and its neighbours finding.
  fields: [
    {
      name: "family",
      words: "mama otec rodič rodina brat sestra syn dcéra súrodenec manžel manželka dedo dieťa".split(" "),
    },
    {
      name: "people around you",
      words: "priateľ priateľka kolega kolegyňa sused chlapec dievča".split(" "),
    },
    {
      name: "fruit, vegetables, basic food",
      words: "ovocie zelenina jablko banán pomaranč hruška jahoda hrozno zemiak paradajka mrkva cibuľa paprika uhorka mlieko cukor soľ maslo chlieb syr mäso ryba ryža polievka".split(" "),
    },
    {
      name: "shops and paying",
      words: "obchod potraviny drogéria lekáreň pokladňa platiť zaplatiť karta hotovosť cena lacný drahý kúpiť nakupovať potrebovať peniaze".split(" "),
    },
    {
      name: "clothes",
      words: "šaty nohavice sukňa košeľa tričko sveter pulóver kabát topánka ponožka čiapka šál blúzka oblek".split(" "),
    },
    {
      name: "time units and seasons",
      words: "sekunda minúta hodina deň týždeň mesiac rok jar leto jeseň zima ráno večer noc dnes zajtra včera".split(" "),
    },
    {
      name: "adjectives for people",
      words: "mladý starý vysoký nízky pekný škaredý múdry hlúpy veselý smutný silný slabý chudý zdravý chorý milý sympatický príjemný nervózny unavený".split(" "),
    },
    {
      name: "free time",
      words: "hrať hudba futbal tenis hokej kino divadlo koncert film čítať tancovať plávať spievať šport počúvať".split(" "),
    },
    {
      name: "phone and contact",
      words: "telefón telefonovať zavolať mobil číslo adresa ulica dopočutia haló".split(" "),
    },
    {
      name: "health and the body",
      words: "lekár lekáreň liek tabletka nemocnica chorý zdravý bolieť hlava ruka noha zub brucho hrdlo horúčka".split(" "),
    },
    {
      name: "countries and languages",
      words: "Slovensko Česko Maďarsko Rakúsko Poľsko Nemecko Anglicko Írsko Taliansko Francúzsko Slovák Slovenka slovenčina angličtina nemčina".split(" "),
    },
    {
      name: "city and transport",
      control: true,
      words: "mesto ulica námestie most rieka kostol hrad pošta banka stanica autobus električka vlak taxík auto metro".split(" "),
    },
    {
      name: "house and room",
      control: true,
      words: "byt izba kuchyňa kúpeľňa posteľ stôl stolička skriňa okno dvere lampa chodba balkón".split(" "),
    },
    {
      name: "university and work",
      control: true,
      words: "univerzita prednáška seminár knižnica skúška firma kancelária porada šéf pohovor životopis zamestnanie".split(" "),
    },
    {
      name: "computer",
      control: true,
      words: "počítač súbor kliknúť uložiť otvoriť zatvoriť vytlačiť heslo internet e-mail".split(" "),
    },
  ],

  checklist: [
    // ── Grammar: the A1 minimum (Kvapil 2018, pp. 28–31). Not required at A1:
    //    the genitive and dative, which the course meets as chunks only.
    { id: "present-byt", kind: "grammar", source: KVAPIL, item: "byť, present tense", in: ["u2-l2"], probe: "\\bsme\\b ; \\bste\\b" },
    { id: "present-regular", kind: "grammar", source: KVAPIL, item: "Present tense of the regular verbs (a-, e-, i-, -ovať types)", in: ["u2-l4", "u7-l4"], probe: "\\bštudujem\\b|\\bpracujem\\b ; \\bspím\\b|\\bvidím\\b" },
    { id: "modals", kind: "grammar", source: KVAPIL, item: "Modal verbs + infinitive", in: ["u5-l5"], probe: "\\bmusím\\b ; \\bmôžem\\b" },
    { id: "past", kind: "grammar", source: KVAPIL, item: "Past tense (A1.2)", in: ["u7-l5"], probe: "past tense" },
    { id: "future-budem", kind: "grammar", source: KVAPIL, item: "Future: budem + infinitive, and budem for byť (A1.2)", in: ["u10-budem"], probe: "\\bbudem \\p{L}+ť\\b ; \\bbudem doma\\b" },
    {
      id: "imperative", kind: "grammar", source: KVAPIL, item: "Imperative, 2nd person singular and plural (A1.2)", in: ["u3-l5", "u4-l2", "u9-l5"], probe: "\\bpoďte\\b ; \\bchoďte\\b",
      open: "Set phrases only (Poďte ďalej, Choďte rovno, Vypíšte); no card on how the form is made. A recognition card would do.",
    },
    { id: "nominative-plural", kind: "grammar", source: KVAPIL, item: "Nominative singular and plural, with adjective agreement", in: ["u3-l2", "u4-l4"], probe: "plural ; \\bsú (nové|pekné|veľké)\\b" },
    { id: "days-v-accusative", kind: "grammar", source: KVAPIL, item: "v + accusative for days (v pondelok)", in: ["u8-l2"], probe: "\\bv pondelok\\b" },
    { id: "accusative-sg", kind: "grammar", source: KVAPIL, item: "Accusative singular", in: ["u5-l2"], probe: "accusative" },
    { id: "accusative-pl", kind: "grammar", source: KVAPIL, item: "Accusative plural, incl. men in -ov", in: ["u5-mnozne"], probe: "\\b(študentov|kamarátov|bratov|lekárov|učiteľov|mužov|chlapcov|kolegov|priateľov|programátorov)\\b" },
    { id: "locative-sg", kind: "grammar", source: KVAPIL, item: "Locative singular after v, na, o, pri", in: ["u8-l5", "u8-l6"], probe: "locative" },
    { id: "locative-pl", kind: "grammar", source: KVAPIL, item: "Locative plural", in: ["u8-mnozne"], // Not the fixed names a course meets early (v Tatrách, v novinách, v Košiciach).
      probe: "\\b(v|vo|na|o|po|pri) (?!tatrách|novinách|košiciach|potravinách|vianoc)\\p{L}+(och|ách|iach)\\b" },
    { id: "instrumental-sg", kind: "grammar", source: KVAPIL, item: "Instrumental singular after s/so", in: ["u6-l3"], probe: "instrumental" },
    { id: "instrumental-pl", kind: "grammar", source: KVAPIL, item: "Instrumental plural", in: ["u6-mnozne"], // Not just the chunk "s kamarátmi" a course meets early.
      probe: "\\b(so|s) (?!kamarát|nimi|nami|vami)\\p{L}+(mi|ami)\\b" },
    { id: "instrumental-place", kind: "grammar", source: KVAPIL, item: "Instrumental after nad, pod, pred, za, medzi", in: ["u6-l5"], probe: "\\bpred \\p{L}+ou\\b|\\bpod \\p{L}+ou\\b" },
    {
      id: "instrumental-bare", kind: "grammar", source: KVAPIL, item: "Instrumental without a preposition: transport and tools", in: ["u6-l4"], probe: "\\bvlakom\\b|\\bautobusom\\b",
      open: "Transport only (Idem vlakom). The tool (píšem perom, platím kartou as a rule) has no card.",
    },
    { id: "possessives-demonstratives", kind: "grammar", source: KVAPIL, item: "Possessives, ten/tá/to and ktorý", in: ["u3-l4", "u3-l6"], probe: "\\bmôj\\b ; \\bktorý\\b" },
    { id: "question-words", kind: "grammar", source: KVAPIL, item: "Question words, incl. koho, s kým, o kom", in: ["u5-l2", "u10-l3"], probe: "\\bkoho\\b ; \\bs kým\\b ; \\bo kom\\b" },
    { id: "negative-words", kind: "grammar", source: KVAPIL, item: "nikto, nič, nikde, nikdy with a negative verb", in: ["u8-l4"], probe: "\\bnikto\\b ; \\bnikdy\\b" },
    { id: "numerals", kind: "grammar", source: KVAPIL, item: "Numerals 0–100; jeden, dva and their forms", in: ["u2-l6", "u4-l5"], probe: "\\bsto\\b ; \\bdvaja\\b|\\bdve\\b" },
    { id: "clock-time", kind: "grammar", source: KVAPIL, item: "Clock times: o jednej, o pol druhej", in: ["u7-l2"], probe: "\\bo jednej\\b ; \\bpol\\b" },
    {
      id: "adverbs", kind: "grammar", source: KVAPIL, item: "Adverbs: trochu, dosť, málo, veľa; určite, možno, asi; rýchlo, pomaly", in: ["u1-l6", "u6-l6"], probe: "\\btrochu\\b ; \\burčite\\b",
      open: "trochu in one exercise; určite and možno only in an intro note (u6-l6); veľa only in a birthday wish. No dosť, málo, asi, pomaly.",
    },
    { id: "health-phrase", kind: "grammar", source: KVAPIL, item: "Bolí ma … (what hurts)", in: ["u9-lekar"], probe: "\\bbolí ma\\b" },
    { id: "weather", kind: "grammar", source: KVAPIL, item: "Weather: Prší, Je teplo", in: ["u10-l2"], probe: "\\bprší\\b ; \\bje teplo\\b" },

    // ── Situations at A1 (Kvapil 2018).
    { id: "introductions", kind: "situation", source: KVAPIL, item: "Introducing yourself and others", in: ["u1-l3", "u2-l1"], probe: "\\bvolám sa\\b ; \\bodkiaľ\\b" },
    { id: "telephoning", kind: "situation", source: KVAPIL, item: "Telephoning", in: ["u2-telefon"], probe: "\\bhaló\\b ; \\bdopočutia\\b" },
    { id: "conversation", kind: "situation", source: KVAPIL, item: "Small talk: how are you, where from, what you do", in: ["u1-l3", "u2-l1", "u2-l4"], probe: "\\bako sa máš\\b ; \\bčo robíš\\b" },
    {
      id: "private-letters", kind: "situation", source: KVAPIL, item: "Private letters and messages", in: ["u8"],
      open: "No letter or e-mail formulas (Milý…/Milá…, S pozdravom, Pozdravujem). Planned for u8, where the textbook has a cover letter.",
    },
    { id: "offices", kind: "situation", source: KVAPIL, item: "At an office: forms and personal data", in: ["u9-l5"], probe: "\\bdotazník\\b" },
    { id: "shopping", kind: "situation", source: KVAPIL, item: "Shopping and paying", in: ["u5-obchod", "u4-l6"], probe: "\\bkartou\\b ; \\bkoľko to stojí\\b" },
    { id: "restaurant", kind: "situation", source: KVAPIL, item: "In a restaurant: ordering, paying", in: ["u6-l1", "u6-l2", "u6-l4"], probe: "\\bjedálny lístok\\b ; \\búčet\\b" },
    { id: "services", kind: "situation", source: KVAPIL, item: "Services: post office, bank", in: ["u4-l2"], probe: "\\bpošta\\b ; \\bbanka\\b" },
    { id: "culture", kind: "situation", source: KVAPIL, item: "Culture: cinema, theatre, concerts, invitations", in: ["u4-l2", "u5-mam-rad", "u6-l6"], probe: "\\bkino\\b ; \\bdivadlo\\b" },
    { id: "health-doctor", kind: "situation", source: KVAPIL, item: "Health and the doctor", in: ["u9-lekar"], probe: "\\blekár" },
    { id: "housing", kind: "situation", source: KVAPIL, item: "Housing: the flat, the room", in: ["u3-l1", "u3-l3", "u3-l5"], probe: "\\bbývam\\b ; \\bbyt\\b" },
    { id: "finding-the-way", kind: "situation", source: KVAPIL, item: "Finding your way", in: ["u4-l2"], probe: "\\bdoprava\\b ; \\brovno\\b" },
    { id: "public-transport", kind: "situation", source: KVAPIL, item: "Public transport", in: ["u6-l4"], probe: "\\bautobusom\\b|\\belektričkou\\b" },

    // ── Topics in its A1 topic list.
    { id: "family", kind: "topic", source: KVAPIL, item: "Family", in: ["u4-rodina"], probe: "\\bmama\\b ; \\botec\\b ; \\brodičia\\b" },
    { id: "daily-routine", kind: "topic", source: KVAPIL, item: "Daily routine", in: ["u7-l3"], probe: "\\bvstávam\\b" },
    { id: "free-time", kind: "topic", source: KVAPIL, item: "Hobbies and free time", in: ["u5-mam-rad"], probe: "\\bhudb ; \\bmám rád\\b|\\bmám rada\\b" },
    {
      id: "clothing", kind: "topic", source: KVAPIL, item: "Clothing", in: ["u5-l3"], probe: "\\btričko\\b ; \\bsveter\\b",
      open: "One lesson with tričko, sveter, košeľa, sukňa; no shoes, coat, jumper, dress, cap (core clothes words 5/14).",
    },

    // ── Can-do statements, CEFR self-assessment grid, A1 (paraphrased).
    { id: "cefr-listening", kind: "can-do", source: CEFR, item: "Listening: familiar words about yourself, your family and your surroundings", in: ["u1-l3", "u4-rodina", "u3-l3"], probe: "\\bvolám sa\\b ; \\bmama\\b" },
    { id: "cefr-reading", kind: "can-do", source: CEFR, item: "Reading: names, words and simple sentences on notices, menus, small ads", in: ["u6-l1", "u10-l2"], probe: "\\bjedálny lístok\\b ; \\binzerát" },
    { id: "cefr-interaction-repeat", kind: "can-do", source: CEFR, item: "Interaction: get by with help, asking the other person to repeat", in: ["u1-l2", "u2-l5"], probe: "\\bnerozumiem\\b" },
    { id: "cefr-interaction-needs", kind: "can-do", source: CEFR, item: "Interaction: ask and answer simple questions on immediate needs (prices, time, shopping)", in: ["u4-l6", "u5-obchod", "u7-l2"], probe: "\\bkoľko to stojí\\b ; \\bkoľko je hodín\\b" },
    { id: "cefr-production", kind: "can-do", source: CEFR, item: "Production: describe where you live and people you know", in: ["u3-l5", "u3-aky-je", "u4-rodina"], probe: "\\bbyt\\b ; \\baký je\\b" },
    {
      id: "cefr-writing-postcard", kind: "can-do", source: CEFR, item: "Writing: a short postcard or greeting", in: ["u5-l6"], probe: "\\bvšetko najlepšie\\b",
      open: "Birthday wishes only; no holiday greeting or postcard formulas (Pozdrav z …, Pozdravujem).",
    },
    {
      id: "cefr-writing-form", kind: "can-do", source: CEFR, item: "Writing: a form with name, nationality, address, phone", in: ["u9-l5", "u2-telefon"], probe: "\\bdotazník\\b ; \\btelefónne číslo\\b",
      open: "No word for address (adresa) and no way to give one.",
    },
  ],
};
