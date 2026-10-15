// Slovak's little words: pronouns, forms of "byť", prepositions, conjunctions,
// particles, question words and possessives. Learned by exposure and through the
// grammar cards rather than drilled one by one: spelling cards skip them (./spelling),
// and the dictionary ranks grammar cards first when one is searched for.
import { stripDiacritics } from "../answers";

/** Accent-free, lowercase. */
export const littleWords: ReadonlySet<string> = new Set(
  `ja ty on ona ono my vy oni ony ma mňa mi mne ťa teba ti tebe ho jeho mu jej ju nás nám vás vám ich im
  sa si seba sebe sebou mnou tebou nami vami nimi
  som je sme ste sú bol bola bolo boli byť
  v vo na z zo do od o po pri s so k ku za pred nad pod cez bez u okrem medzi
  a aj ale alebo že či nie áno už ešte tu tam len iba aby keď lebo pretože tak teda
  to ten tá tie tí toto tento táto tieto
  kto čo kde ako kedy prečo koľko aký aká aké akí ktorý ktorá ktoré kam odkiaľ
  môj moja moje moji tvoj tvoja tvoje náš naša naše váš vaša vaše svoj svoja svoje`
    .split(/\s+/)
    .filter(Boolean)
    .map(stripDiacritics),
);
