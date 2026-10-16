// What each review word is: part of speech, gender, topic, register. Keyed like review
// items (`reviewItemId`: the Slovak, lowercase, final punctuation off), so the tags
// survive lessons being edited or reordered. Word review uses them to pick wrong
// options that fit (see ../review/session); anything that needs to know what a word is
// can build on them. Every review item needs an entry: `npm run validate:course` checks.

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "expression";

export type Topic =
  | "greetings"
  | "courtesy"
  | "about-me"
  | "home"
  | "furniture"
  | "town"
  | "jobs"
  | "food"
  | "clothes"
  | "celebrations"
  | "travel"
  | "study"
  | "time"
  | "routine"
  | "work"
  | "computer"
  | "forms"
  | "media"
  | "weather"
  | "phone"
  | "people"
  | "family"
  | "shopping"
  | "hobbies"
  | "health";

export type WordTags = {
  /** A word's part of speech (a noun phrase is a noun); "expression" for a greeting, question or sentence. */
  pos: PartOfSpeech;
  /** Nouns: the head noun's gender. Absent for pairs ("chlieb a maslo") that mix them. */
  gender?: "m" | "f" | "n";
  /** Nouns used only in the plural ("noviny"). */
  plural?: true;
  topic: Topic;
  /** Where Slovak marks it: ty forms and "Ahoj" are informal, vy forms and "Dobrý deň" polite. */
  register?: "informal" | "polite";
};

export const topics: readonly Topic[] = [
  "greetings",
  "courtesy",
  "about-me",
  "home",
  "furniture",
  "town",
  "jobs",
  "food",
  "clothes",
  "celebrations",
  "travel",
  "study",
  "time",
  "routine",
  "work",
  "computer",
  "forms",
  "media",
  "weather",
  "phone",
  "people",
  "family",
  "shopping",
  "hobbies",
  "health",
];

const noun = (gender: "m" | "f" | "n" | null, topic: Topic, plural?: true): WordTags => ({
  pos: "noun",
  ...(gender && { gender }),
  ...(plural && { plural }),
  topic,
});
const say = (topic: Topic, register?: "informal" | "polite"): WordTags => ({
  pos: "expression",
  topic,
  ...(register && { register }),
});

export const lexicon: Record<string, WordTags> = {
  // Unit 1
  ahoj: say("greetings", "informal"),
  "dobrý deň": say("greetings", "polite"),
  "dobré ráno": say("greetings"),
  "dobrý večer": say("greetings"),
  dovidenia: say("greetings", "polite"),
  "dobrú noc": say("greetings"),
  "dobrú chuť": say("courtesy"),
  ďakujem: say("courtesy"),
  prosím: say("courtesy"),
  "nech sa páči": say("courtesy"),
  prepáčte: say("courtesy", "polite"),
  "nič sa nestalo": say("courtesy"),
  "na zdravie": say("courtesy"),
  "ako sa máš": say("about-me", "informal"),
  "mám sa výborne": say("about-me"),
  "mám sa zle": say("about-me"),
  "ako sa voláš": say("about-me", "informal"),
  "volám sa emma": say("about-me"),
  "teší ma": say("about-me"),

  // Unit 2
  "odkiaľ si": say("about-me", "informal"),
  "som z írska": say("about-me"),
  "som z ukrajiny": say("about-me"),
  "som írka": say("about-me"),
  "koľko máš rokov": say("about-me", "informal"),
  "mám dvadsaťpäť rokov": say("about-me"),
  haló: say("phone"),
  "tu je emma": say("phone"),
  telefonovať: { pos: "verb", topic: "phone" },
  "telefónne číslo": noun("n", "phone"),
  "zavolám ti": say("phone", "informal"),
  dopočutia: say("phone"),

  // Unit 3
  izba: noun("f", "home"),
  kuchyňa: noun("f", "home"),
  kúpeľňa: noun("f", "home"),
  balkón: noun("m", "home"),
  "kde je kuchyňa": say("home"),
  vrátnica: noun("f", "home"),
  "bývam na internáte": say("home"),
  posteľ: noun("f", "furniture"),
  stôl: noun("m", "furniture"),
  skriňa: noun("f", "furniture"),
  lampa: noun("f", "furniture"),
  okno: noun("n", "home"),
  byt: noun("m", "home"),
  "poďte ďalej": say("courtesy", "polite"),
  chodba: noun("f", "home"),
  obývačka: noun("f", "home"),
  spálňa: noun("f", "home"),
  "aký je tomáš": say("people"),
  "veselý a smutný": { pos: "adjective", topic: "people" },
  "milý a sympatický": { pos: "adjective", topic: "people" },
  "múdry a hlúpy": { pos: "adjective", topic: "people" },
  "silný a slabý": { pos: "adjective", topic: "people" },

  // Unit 4
  mesto: noun("n", "town"),
  dedina: noun("f", "town"),
  námestie: noun("n", "town"),
  kostol: noun("m", "town"),
  "hrad je starý": say("town"),
  most: noun("m", "town"),
  rieka: noun("f", "town"),
  vysoký: { pos: "adjective", topic: "town" },
  kaviareň: noun("f", "town"),
  kino: noun("n", "town"),
  divadlo: noun("n", "town"),
  múzeum: noun("n", "town"),
  "pošta je oproti": say("town"),
  čašník: noun("m", "jobs"),
  predavač: noun("m", "jobs"),
  novinár: noun("m", "jobs"),
  šofér: noun("m", "jobs"),
  dôchodca: noun("m", "jobs"),
  "moja rodina": noun("f", "family"),
  "mama a otec": noun(null, "family"),
  "brat a sestra": noun(null, "family"),
  "syn a dcéra": noun(null, "family"),
  "manžel a manželka": noun(null, "family"),
  "ženatý / vydatá": { pos: "adjective", topic: "family" },

  // Unit 5
  "chlieb a maslo": noun(null, "food"),
  "syr a šunka": noun(null, "food"),
  "káva a minerálka": noun(null, "food"),
  "koľko stojí šunka": say("food"),
  "kúpim čerstvý chlieb": say("food"),
  obchod: noun("m", "shopping"),
  "ovocie a zelenina": noun(null, "food"),
  "jablko a banán": noun(null, "food"),
  "zemiaky a cibuľa": noun(null, "food"),
  "ešte niečo": say("shopping"),
  "platím kartou": say("shopping"),
  "tričko a sveter": noun(null, "clothes"),
  "sukňa a košeľa": noun(null, "clothes"),
  "chcem čierne tričko": say("clothes"),
  "hudba a film": noun(null, "hobbies"),
  "futbal a tenis": noun("m", "hobbies"),
  "počúvať hudbu": { pos: "verb", topic: "hobbies" },
  "tancovať a spievať": { pos: "verb", topic: "hobbies" },
  darček: noun("m", "celebrations"),
  "všetko najlepšie": say("celebrations"),
  "torta a sviečky": noun(null, "celebrations"),
  kytica: noun("f", "celebrations"),
  "ďakujem za darček": say("celebrations"),

  // Unit 6
  "jedálny lístok": noun("m", "food"),
  polievka: noun("f", "food"),
  "hlavné jedlo": noun("n", "food"),
  "kuracie mäso": noun("n", "food"),
  ryba: noun("f", "food"),
  ryža: noun("f", "food"),
  hranolky: noun("m", "food", true),
  "čo si dáte": say("food", "polite"),
  "dám si polievku": say("food"),
  "a na pitie": say("food"),
  "chutí ti": say("food", "informal"),
  horúci: { pos: "adjective", topic: "food" },
  sladký: { pos: "adjective", topic: "food" },
  slaný: { pos: "adjective", topic: "food" },
  "spolu alebo osobitne": say("food"),
  "ako ideš domov": say("travel", "informal"),
  "idem autobusom": say("travel"),
  pešo: { pos: "adverb", topic: "travel" },
  "cestujem s kamarátmi": say("travel"),
  "ďakujem za pozvanie": say("celebrations"),

  // Unit 7
  prednáška: noun("f", "study"),
  seminár: noun("m", "study"),
  knižnica: noun("f", "study"),
  "rozvrh hodín": noun("m", "study"),
  skúška: noun("f", "study"),
  referát: noun("m", "study"),
  "koľko je hodín": say("time"),
  "o koľkej": say("time"),
  "je pol ôsmej": say("time"),
  "sprchujem sa": say("routine"),
  raňajkujem: say("routine"),
  "doobeda mám prednášky": say("study"),
  "učím sa": say("study"),
  "večer som unavená": say("routine"),

  // Unit 8
  firma: noun("f", "work"),
  oddelenie: noun("n", "work"),
  "zamestnanec / zamestnankyňa": noun(null, "jobs"),
  porada: noun("f", "work"),
  stretnutie: noun("n", "work"),
  stáž: noun("f", "work"),
  životopis: noun("m", "work"),
  pohovor: noun("m", "work"),
  "cez víkend": { pos: "adverb", topic: "time" },
  pozajtra: { pos: "adverb", topic: "time" },
  "v lete": { pos: "adverb", topic: "time" },
  "v zime": { pos: "adverb", topic: "time" },
  "jar a jeseň": noun("f", "time"),
  "týždeň a mesiac": noun("m", "time"),
  "minúta a sekunda": noun("f", "time"),

  // Unit 9
  konferencia: noun("f", "work"),
  pozvánka: noun("f", "work"),
  prihláška: noun("f", "forms"),
  "prestávka na kávu": noun("f", "work"),
  "necítim sa dobre": say("health"),
  "bolí ma hlava": say("health"),
  "som chorá": say("health"),
  "mám horúčku": say("health"),
  liek: noun("m", "health"),
  "rýchlo sa uzdrav": say("health", "informal"),
  súbor: noun("m", "computer"),
  otvoriť: { pos: "verb", topic: "computer" },
  uložiť: { pos: "verb", topic: "computer" },
  "kliknúť na ikonu": { pos: "verb", topic: "computer" },
  "kopírovať a vložiť": { pos: "verb", topic: "computer" },
  vytlačiť: { pos: "verb", topic: "computer" },
  "poslať e-mailom": { pos: "verb", topic: "computer" },
  dotazník: noun("m", "forms"),
  "trvalé bydlisko": noun("n", "forms"),
  národnosť: noun("f", "forms"),
  zamestnávateľ: noun("m", "jobs"),

  // Unit 10
  noviny: noun("f", "media", true),
  článok: noun("m", "media"),
  titulok: noun("m", "media"),
  správy: noun("f", "media", true),
  časopis: noun("m", "media"),
  "šport a kultúra": noun(null, "media"),
  počasie: noun("n", "weather"),
  "je slnečno": say("weather"),
  "je oblačno": say("weather"),
  prší: say("weather"),
  inzerát: noun("m", "media"),
  "firma hľadá programátora": say("jobs"),
};
