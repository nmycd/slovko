// The coverage gate (CONTENT-PIPELINE.md, stage 3): does a level teach what its
// textbook and the outside standards say it must?
//
//   npm run -s course:coverage                 # A1, every unit
//   npm run -s course:coverage -- u5           # one unit's sections, plus the level-wide ones
//   npm run -s course:coverage -- a1 --detail  # also list every missing glossary word and point
//   npm run -s course:coverage -- a2           # A2 (or --course a2; a2-u5 or u5 for one unit)
//   npm run -s course:coverage -- --find 'kartou|v hotovosti'   # where the course says it
//   npm run -s course:coverage -- --inventory research/inventory/a1-draft   # another inventory folder
//   npm run -s course:coverage -- --planned    # checklist items checked per unit, as planned in stage 1
//
// Four checks:
//   1. Glossary: each textbook lesson's glossary against the words the course uses,
//      overall and by everyday field (needs the local inventory).
//   2. Core words: the level's everyday fields against the whole course.
//   3. Points: each textbook lesson's grammar, situations and functions, found by
//      their markers (needs the local inventory).
//   4. Checklist: the outside standard's items, each where the level says it's taught.
//
// The inventory is derived from a copyrighted book, so it lives in git-ignored
// research/ and may be missing: then 1 and 3 are skipped with a note. Exits with
// code 1 when anything is flagged.

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { courseById, isCourseId } from "../src/lib/course/courses";
import { levels } from "../src/lib/course/levels";
import type { ChecklistItem, WordField } from "../src/lib/course/levels/types";
import type { Exercise, Unit } from "../src/lib/course/types";
import { courseArg } from "./course-files";

/** A field or a lesson's points below this share is flagged (justified in CONTENT-PIPELINE.md, stage 3). */
const FIELD_MIN = 0.7;
/** Per-unit glossary fields with fewer entries than this aren't flagged: one word would swing them 25 %+. */
const FIELD_MIN_ENTRIES = 4;

const { files, rest: args } = courseArg();
const flagValue = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const findPattern = flagValue("--find");
const inventoryArg = flagValue("--inventory");
const detail = args.includes("--detail");
/** Check each checklist item against its whole unit (u4-rodina → u4), as planned in stage 1: for a backtest. */
const planned = args.includes("--planned");
const plain = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--find" && args[i - 1] !== "--inventory");
const levelKey = (plain.find((a) => /^[abc][12]$/i.test(a)) ?? files.course.id).toLowerCase();
/** What the level's unit and lesson ids start with: "" for A1, "a2-" for A2. */
const prefix = isCourseId(levelKey) ? courseById(levelKey).prefix : "";
/** A unit's number from its id ("a2-u5", or "u5" on the command line), or NaN. */
const unitOf = (name: string, exact = true) =>
  Number(new RegExp(`^(?:${prefix})?u(\\d+)${exact ? "$" : "(?:-|$)"}`, "i").exec(name)?.[1] ?? NaN);
const onlyUnits = plain.map((a) => unitOf(a)).filter((n) => !Number.isNaN(n));

const level = levels[levelKey];
if (!level) {
  console.error(`No level "${levelKey}". Levels: ${Object.keys(levels).join(", ")}.`);
  process.exit(2);
}

// ---------------------------------------------------------------- course text

/** A piece of Slovak the learner sees, with where it is. */
type Row = { where: string; unit: number; type: string; text: string; prior: boolean };

const strip = (s: string) => s.replace(/\*\*/g, "").normalize("NFC");

/**
 * The words a learner meets, as the A1 comparison counted them (research/comparison,
 * tools/vocab.js): Slovak sentences, cards, tiles and pairs, not notes or English.
 */
function vocabTexts(e: Exercise): string[] {
  switch (e.type) {
    case "intro":
      return [e.sk];
    case "grammar":
      return [...(e.table?.rows.flat() ?? []), ...(e.examples ?? []).map((x) => x.sk)];
    case "choice":
      return [e.sk ?? "", ...(e.optionsLang === "sk" ? [e.options[e.answer]] : [])];
    case "build":
      return e.promptLang === "sk" ? [e.prompt] : e.answers;
    case "fill":
      return [`${e.before} ${e.options[e.answer]} ${e.after}`];
    case "match":
      return e.pairs.map((p) => p.sk);
    case "memorize":
      return [];
    default:
      return [e.sk];
  }
}

/** Everything a marker may find: the words above plus intro notes and grammar cards' titles and text (and lesson titles). */
function markerTexts(e: Exercise): string[] {
  if (e.type === "intro") return [e.sk, e.note ?? ""];
  if (e.type === "grammar") return [e.title, ...e.body, ...vocabTexts(e)];
  return vocabTexts(e);
}

function rows(units: Unit[], prior: boolean, pick: (e: Exercise) => string[], tag = "", titles = false) {
  const out: Row[] = [];
  for (const u of units)
    for (const l of u.lessons) {
      if (titles) out.push({ where: `${tag}${l.id}`, unit: u.number, type: "title", text: strip(`${l.title} ‖ ${l.titleEn}`), prior });
      for (const e of l.exercises) {
        const text = strip(pick(e).join(" ‖ "));
        if (text.trim()) out.push({ where: `${tag}${l.id}`, unit: u.number, type: e.type, text, prior });
      }
    }
  return out;
}

const priorLevels = level.knows ?? [];
const priorRows = (pick: (e: Exercise) => string[], titles = false) =>
  priorLevels.flatMap((p) => rows(p.units, true, pick, `${p.name}:`, titles));
const vocabRows = [...priorRows(vocabTexts), ...rows(level.units, false, vocabTexts)];
/** Markers and probes also see lesson titles: "Abeceda a výslovnosť" teaches the alphabet. */
const markRows = [...priorRows(markerTexts, true), ...rows(level.units, false, markerTexts, "", true)];

// --------------------------------------------------------------- regexes

/** `\b` that knows Slovak letters (JavaScript's own only knows a–z). */
const BOUNDARY = "(?:(?<=\\p{L})(?!\\p{L})|(?<!\\p{L})(?=\\p{L}))";
const regex = (source: string) => new RegExp(source.replace(/\\b/g, BOUNDARY), "iu");

/** The first row (in course order) that matches, or none. */
const firstHit = (re: RegExp, among: Row[] = markRows) => among.find((r) => re.test(r.text));

if (findPattern !== undefined) {
  const re = regex(findPattern);
  const hits = markRows.filter((r) => re.test(r.text));
  console.log(`${hits.length} hits for /${findPattern}/`);
  for (const h of hits.slice(0, 60)) console.log(`  ${h.where} [${h.type}] ${h.text.slice(0, 150)}`);
  process.exit(0);
}

// ------------------------------------------------------- word matching
// The comparison's stem matcher (research/comparison/tools/vocab.js), so the
// numbers are comparable: a word counts as used when a token starts with its
// first n − 2 letters (at least 4), plus verb stems and a few irregular forms.

const norm = (s: string) => s.normalize("NFC").toLowerCase();
const tokens = (s: string) => norm(s).replace(/\*\*/g, "").match(/\p{L}+/gu) ?? [];

/** Token → the first place it occurs, in course order. */
function tokenIndex(from: Row[]) {
  const index = new Map<string, Row>();
  for (const r of from) for (const t of tokens(r.text)) if (!index.has(t)) index.set(t, r);
  return index;
}

const IRREGULAR: Record<string, string[]> = {
  mať: ["mám", "máš", "má", "máme", "máte", "majú", "mal"],
  byť: ["som", "si", "je", "sme", "ste", "sú", "bol"],
  ísť: ["idem", "ideš", "ide", "ideme", "idete", "idú", "išiel", "išla", "išli", "choď"],
  jesť: ["jem", "ješ", "jeme", "jete", "jedia", "jedol", "jedla"],
  piť: ["pijem", "piješ", "pije", "pijú", "pil"],
  žiť: ["žijem", "žiješ", "žije", "žijú", "žil"],
  brať: ["beriem", "berieš", "berie", "berú", "bral"],
  spať: ["spím", "spíš", "spí", "spia", "spal"],
  stáť: ["stojí", "stojím", "stoja", "stál"],
  chcieť: ["chcem", "chceš", "chce", "chceme", "chcete", "chcú", "chcel"],
  môcť: ["môžem", "môžeš", "môže", "môžu", "mohol", "mohla"],
  vedieť: ["viem", "vieš", "vie", "vieme", "viete", "vedia", "vedel"],
  prísť: ["prídem", "prídeš", "príde", "prídu", "prišiel", "prišla"],
  odísť: ["odídem", "odíde", "odišiel", "odišla"],
  niesť: ["nesiem", "nesie", "niesol"],
  pes: ["psa", "psy", "psov"],
  deň: ["dňa", "dni", "dňoch"],
  otec: ["otca", "otcovia"],
  človek: ["ľudia", "človeka"],
  dieťa: ["deti", "dieťaťa"],
};

function variants(w: string) {
  const v = [w.slice(0, w.length <= 4 ? w.length : Math.max(4, w.length - 2))];
  if (IRREGULAR[w]) v.push(...IRREGULAR[w]);
  if (/ovať$/.test(w)) v.push(w.slice(0, -4) + "uj");
  else if (/ieť$/.test(w) && w.length >= 6) v.push(w.slice(0, -3) + "í", w.slice(0, -3) + "e");
  else if (/núť$/.test(w)) v.push(w.slice(0, -3) + "n");
  else if (/[aá]ť$/.test(w) && w.length >= 6) v.push(w.slice(0, -2));
  else if (/iť$/.test(w) && w.length >= 5) v.push(w.slice(0, -2) + "í", w.slice(0, -2) + "i");
  if (/ec$/.test(w) && w.length >= 5) v.push(w.slice(0, -2) + "c");
  if (/eň$/.test(w) && w.length >= 5) v.push(w.slice(0, -2) + "n", w.slice(0, -2) + "ň");
  if (/ok$/.test(w) && w.length >= 6) v.push(w.slice(0, -2) + "k");
  return v;
}

/** Where the course first uses a word (any form), or undefined. */
function findWord(index: Map<string, Row>, word: string) {
  // Tokens are runs of letters, so a hyphenated word ("e-mail") is matched by its last part.
  const w = norm(word).replace(/^.*-(?=\p{L}{3,}$)/u, "");
  const vs = variants(w);
  for (const [t, row] of index)
    for (const st of vs) if (IRREGULAR[w]?.includes(st) ? t === st : t.startsWith(st)) return row;
  return undefined;
}

const LITTLE = new Set(
  "sa si na v vo z zo s so do o a k ku po pre za od pri je to mi ti sú som nie ne sk sg pl form neform".split(" "),
);

/** An entry counts as used when all its content words are: "platiť kartou" needs both. */
function entryUsed(index: Map<string, Row>, entry: string) {
  const words = tokens(entry).filter((w) => !LITTLE.has(w) && w.length >= 2);
  const missing = words.filter((w) => !findWord(index, w));
  return { used: missing.length === 0, missing, words };
}

const vocabIndex = tokenIndex(vocabRows);
/** Also intro notes and grammar-card text: a word found only here is mentioned, not taught. */
const mentionIndex = tokenIndex(markRows);
const mentioned = (word: string) => {
  const row = findWord(mentionIndex, word);
  return row ? `${word} (mentioned in ${row.where})` : word;
};

// ----------------------------------------------------------- reporting

const flags: string[] = [];
const pct = (k: number, n: number) => (n ? `${Math.round((100 * k) / n)}%` : "–");
const shown = (unit: number) => !onlyUnits.length || onlyUnits.includes(unit);
const heading = (s: string) => console.log(`\n${s}\n${"─".repeat(Math.min(78, s.length))}`);

console.log(`Coverage gate, ${level.name}: ${level.units.length} units, ${level.units.reduce((n, u) => n + u.lessons.length, 0)} lessons`);
if (priorLevels.length) console.log(`Words from ${priorLevels.map((p) => p.name).join(", ")} count as known.`);

// Decisions from the coverage review (stage 4): "id<TAB>verdict<TAB>note", next to the inventory.
type Verdict = "taught" | "skip" | "open" | "missing";
const decisions = new Map<string, { verdict: Verdict; note: string }>();

function readTsv(file: string) {
  return readFileSync(file, "utf8")
    .split("\n")
    .slice(1)
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.split("\t"));
}

const inventory = level.textbook && resolve(inventoryArg ?? level.textbook.inventory);
const haveInventory = !!inventory && existsSync(inventory);
if (level.textbook && !haveInventory)
  console.log(
    `\nNo textbook inventory at ${inventoryArg ?? level.textbook.inventory} (it's local only: CONTENT-PIPELINE.md, stage 1).` +
      `\nGlossary and points checks skipped; core words and the checklist still run.`,
  );
if (haveInventory && existsSync(join(inventory!, "decisions.tsv")))
  for (const [id, verdict, note = ""] of readTsv(join(inventory!, "decisions.tsv")))
    if (id && verdict) decisions.set(id.trim(), { verdict: verdict.trim() as Verdict, note: note.trim() });

/** The field(s) a glossary entry belongs to, by its words. */
const fieldOf = new Map<string, WordField[]>();
for (const f of level.fields)
  for (const w of f.words) fieldOf.set(norm(w), [...(fieldOf.get(norm(w)) ?? []), f]);

// ------------------------------------------------------- 1. glossary

if (haveInventory) {
  heading(`1. Textbook glossary, by lesson (fields under ${FIELD_MIN * 100}% with ${FIELD_MIN_ENTRIES}+ entries are flagged)`);
  console.log("A word counts as taught when the course uses it anywhere. \"!\" = flagged.");
  let all = 0,
    allUsed = 0;
  for (const { lesson, unit } of level.textbook!.lessons) {
    const file = join(inventory!, `glossary-L${lesson}.tsv`);
    if (!existsSync(file)) {
      if (shown(unit)) console.log(`  L${lesson}: no glossary-L${lesson}.tsv`);
      continue;
    }
    const entries = readTsv(file)
      .map(([sk, , , section = "word", field]) => ({ sk: sk?.trim() ?? "", section: section.trim() || "word", field: field?.trim() }))
      .filter((g) => g.sk && !/ = /.test(g.sk));
    const results = entries.map((g) => ({ ...g, ...entryUsed(vocabIndex, g.sk) }));
    const used = results.filter((r) => r.used).length;
    all += results.length;
    allUsed += used;
    if (!shown(unit)) continue;
    const phrases = results.filter((r) => r.section === "phrase");
    const byField = new Map<string, { n: number; k: number; missing: string[] }>();
    for (const r of results) {
      if (r.section === "phrase") continue;
      // A field's core words only: "mäso" is food, "bravčové mäso" isn't counted.
      const names = r.field
        ? [r.field]
        : r.words.length
          ? (fieldOf.get(r.words[0]) ?? [])
              .map((f) => f.name)
              .filter((name) => r.words.every((w) => fieldOf.get(w)?.some((f) => f.name === name)))
          : [];
      for (const name of names) {
        const b = byField.get(name) ?? { n: 0, k: 0, missing: [] };
        b.n++;
        if (r.used) b.k++;
        else b.missing.push(r.sk);
        byField.set(name, b);
      }
    }
    console.log(
      `\n${prefix}u${unit} ← L${lesson}: ${results.length} entries, ${used} taught (${pct(used, results.length)}); ` +
        `phrases ${phrases.filter((r) => r.used).length}/${phrases.length}`,
    );
    const cells: string[] = [];
    for (const f of level.fields) {
      const b = byField.get(f.name);
      if (!b) continue;
      const low = b.n >= FIELD_MIN_ENTRIES && b.k / b.n < FIELD_MIN;
      const decided = decisions.get(`L${lesson}:${f.name}`);
      if (low && !(decided && decided.verdict !== "open" && decided.verdict !== "missing"))
        flags.push(`glossary L${lesson} ${f.name}: ${b.k}/${b.n}`);
      cells.push(`${low ? "!" : " "}${f.name} ${b.k}/${b.n}${low ? ` (missing ${b.missing.map(mentioned).join(", ")})` : ""}`);
    }
    for (const c of cells) console.log(`   ${c}`);
    if (detail)
      console.log(`   not taught: ${results.filter((r) => !r.used).map((r) => (r.section === "phrase" ? `[${r.sk}]` : r.sk)).join(", ")}`);
  }
  if (!onlyUnits.length) console.log(`\nAll lessons: ${all} entries, ${allUsed} taught (${pct(allUsed, all)}). Not gated: see stage 3.`);
}

// ------------------------------------------------------- 2. core words

heading(`2. Core words by field, whole course (under ${FIELD_MIN * 100}% is flagged)`);
if (!level.fields.length) {
  console.log(`No fields for ${level.name} yet: fill them in src/lib/course/levels/${level.key}.ts.`);
  flags.push(`fields ${level.name}: none`);
}
for (const f of level.fields) {
  const missing = f.words.filter((w) => !findWord(vocabIndex, w));
  const k = f.words.length - missing.length;
  const low = k / f.words.length < FIELD_MIN;
  const decided = decisions.get(`field:${f.name}`);
  const excused = decided && (decided.verdict === "skip" || decided.verdict === "taught");
  if (low && !excused) flags.push(`core words ${f.name}: ${k}/${f.words.length}`);
  console.log(
    `${low ? (excused ? "~" : "!") : " "} ${f.name.padEnd(30)} ${String(k).padStart(2)}/${String(f.words.length).padEnd(2)} ${pct(k, f.words.length).padStart(4)}` +
      `${f.control ? "  (control)" : ""}${missing.length ? `  missing: ${missing.map(mentioned).join(", ")}` : ""}`,
  );
}

// ------------------------------------------------------- 3. points

type Point = { id: string; kind: string; point: string; pages: string; markers: string };
const VERDICT_ORDER = ["taught", "skip", "missing", "open high", "open medium", "open low", "open unrated"];

if (haveInventory) {
  heading("3. Textbook points: grammar, situations, functions (every miss must be decided)");
  console.log('A point is found when each of its marker groups matches somewhere in the course. "!" = flagged.');
  const totals = { n: 0, found: 0, decided: 0, flagged: 0 };
  const verdicts: Record<string, number> = {};
  for (const { lesson, unit } of level.textbook!.lessons) {
    const file = join(inventory!, `points-L${lesson}.tsv`);
    if (!existsSync(file)) {
      if (shown(unit)) console.log(`  L${lesson}: no points-L${lesson}.tsv`);
      continue;
    }
    const points: Point[] = readTsv(file).map(([id, kind, point, pages, markers]) => ({
      id: id.trim(),
      kind: kind?.trim(),
      point: point?.trim(),
      pages: pages?.trim(),
      markers: markers?.trim() ?? "",
    }));
    const lines: string[] = [];
    let found = 0,
      decided = 0;
    for (const p of points) {
      let hits: (Row | undefined)[];
      try {
        hits = p.markers.split(" ; ").map((m) => firstHit(regex(m.trim())));
      } catch (err) {
        flags.push(`points ${p.id}: bad marker (${(err as Error).message})`);
        lines.push(`!  ${p.id} bad marker: ${p.markers}`);
        continue;
      }
      const isFound = p.markers !== "" && hits.every(Boolean);
      const d = decisions.get(p.id);
      if (d) {
        // An open gap's note may start with its importance ("high: …"), counted apart.
        const key = d.verdict === "open" ? `open ${/^(high|medium|low):/.exec(d.note)?.[1] ?? "unrated"}` : d.verdict;
        verdicts[key] = (verdicts[key] ?? 0) + 1;
      }
      // A decision overrides the markers: "taught" (under another form) and "skip" count,
      // "missing" (the markers matched something else) and "open" (a known gap) don't.
      const ok = d ? d.verdict === "taught" || d.verdict === "skip" : isFound;
      if (isFound) found++;
      if (ok && !isFound) decided++;
      if (!ok) flags.push(`points ${p.id} (${prefix}u${unit}): ${p.point}`);
      const where = isFound ? [...new Set(hits.map((h) => h!.where))].join(", ") : "";
      if (!ok || detail || d)
        lines.push(
          `${ok ? (isFound ? " ✓" : " ~") : "! "} ${p.id.padEnd(7)} ${p.kind.padEnd(13)} ${p.point}` +
            (isFound ? `  [${where}]` : `  [${p.markers}]`) +
            (d ? `\n             ${d.verdict}: ${d.note}` : ""),
        );
    }
    totals.n += points.length;
    totals.found += found;
    totals.decided += decided;
    totals.flagged += lines.filter((l) => l.startsWith("!")).length;
    if (!shown(unit)) continue;
    const flagged = lines.filter((l) => l.startsWith("!")).length;
    console.log(`\n${prefix}u${unit} ← L${lesson}: ${points.length} points, ${found} found (${pct(found, points.length)}), ${decided} decided otherwise, ${flagged} flagged`);
    for (const l of lines) console.log(`  ${l}`);
  }
  if (!onlyUnits.length)
    console.log(
      `\nAll lessons: ${totals.n} points, ${totals.found} found (${pct(totals.found, totals.n)}), ` +
        `${totals.decided} decided otherwise, ${totals.flagged} flagged. ` +
        `Decisions: ${
          Object.entries(verdicts)
            .sort(([a], [b]) => VERDICT_ORDER.indexOf(a) - VERDICT_ORDER.indexOf(b))
            .map(([v, n]) => `${v} ${n}`)
            .join(", ") || "none"
        }.`,
    );
}

// ------------------------------------------------------- 4. checklist

heading(`4. ${level.name} checklist from outside standards`);
if (!level.checklist.length) {
  console.log(`No checklist for ${level.name} yet: fill it in src/lib/course/levels/${level.key}.ts before writing units.`);
  flags.push(`checklist ${level.name}: empty`);
}
const lessonIds = new Set(level.units.flatMap((u) => u.lessons.map((l) => l.id)));
const unitNumbers = new Set(level.units.map((u) => u.number));

function checkItem(item: ChecklistItem): { mark: string; note: string; flagged: boolean } {
  if (!item.in.length) return { mark: "!", note: "not placed in any unit", flagged: true };
  const problems: string[] = [];
  const scope: Row[] = [];
  const places = planned
    ? [...new Set(item.in.map((p) => p.replace(new RegExp(`^((?:${prefix})?u\\d+)-.*`), "$1")))]
    : item.in;
  for (const place of places) {
    const unit = unitOf(place); // "a2-u5", or "u5" in the level's own file
    if (!Number.isNaN(unit)) {
      if (!unitNumbers.has(unit)) problems.push(`${place} doesn't exist yet`);
      else scope.push(...markRows.filter((r) => !r.prior && r.unit === unit));
    } else if (!lessonIds.has(place)) problems.push(`no lesson ${place}`);
    else scope.push(...markRows.filter((r) => !r.prior && r.where === place));
  }
  if (!problems.length && !scope.length) problems.push(`nothing written in ${places.join(", ")} yet`);
  if (item.probe && scope.length)
    for (const group of item.probe.split(" ; "))
      if (!firstHit(regex(group.trim()), scope)) problems.push(`/${group.trim()}/ not found in ${places.join(", ")}`);
  if (problems.length) return { mark: "!", note: problems.join("; "), flagged: true };
  if (item.open) return { mark: "~", note: `open: ${item.open}`, flagged: true };
  return { mark: "✓", note: "", flagged: false };
}

for (const kind of ["grammar", "situation", "topic", "can-do"] as const) {
  const items = level.checklist.filter((i) => i.kind === kind);
  if (!items.length) continue;
  const relevant = items.filter(
    (i) => !onlyUnits.length || i.in.some((p) => onlyUnits.includes(unitOf(p, false))),
  );
  if (!relevant.length) continue;
  console.log(`\n${kind}`);
  for (const item of relevant) {
    const r = checkItem(item);
    if (r.flagged) flags.push(`checklist ${item.id}: ${r.note}`);
    console.log(
      `${r.mark === "✓" ? " " : r.mark} ${item.id.padEnd(22)} ${item.item}  [${item.in.join(", ") || "–"}]` +
        (r.note ? `\n${" ".repeat(25)}${r.note}` : ""),
    );
  }
}
const counted = level.checklist.map(checkItem);
if (!onlyUnits.length && level.checklist.length)
  console.log(
    `\n${counted.filter((r) => r.mark === "✓").length} of ${level.checklist.length} items covered, ` +
      `${counted.filter((r) => r.mark === "~").length} open, ${counted.filter((r) => r.mark === "!").length} failing.`,
  );
if (Object.keys(level.sources).length)
  console.log(`\nSources: ${Object.entries(level.sources).map(([k, v]) => `${k} = ${v}`).join("; ")}`);

// ------------------------------------------------------------- result

heading(flags.length ? `${flags.length} flagged` : "✓ nothing flagged");
for (const f of flags) console.log(`  ${f}`);
process.exit(flags.length ? 1 : 0);
