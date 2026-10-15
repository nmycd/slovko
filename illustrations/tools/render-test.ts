/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from course modules and the Gemini API */
// Test renders of planned pictures with Gemini image models ("Nano Banana").
// Usage: npx tsx illustrations/tools/render-test.ts [--with-crop] [--dry-run] [--model ID] [--size 1K] u1-l1#3 u1-l2#9 …
// --dry-run prints the prompt (text parts and image files) without calling the API.
//
// Sends the style references (illustrations/style-refs/, git-ignored), the cast
// looks from README.md and the entry's picture description. With --with-crop it
// also sends the textbook crop: for internal comparison only, never for pictures
// we ship. Output goes to illustrations/test-renders/ (git-ignored).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const root = process.cwd();
const dir = join(root, "illustrations");
const STYLE_REFS = ["mdn-013.jpg", "mdn-014.jpg", "mdn-049.jpg"];
// USD per 1M tokens (input, text/thinking output) and per image, from
// ai.google.dev/gemini-api/docs/pricing (October 2026). Only models we've priced.
const PRICES: Record<string, { input: number; text: number; image: Record<string, number> }> = {
  "gemini-nano-banana-2.1": { input: 1.5, text: 7.5, image: { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 } },
  "gemini-3.1-flash-image": { input: 0.5, text: 3, image: { "1K": 0.067, "2K": 0.101, "4K": 0.151 } },
};

type Entry = { lesson: string; exercise: number; text: string; picture?: string; reuse?: string; book: any };

function parseArgs() {
  const args = process.argv.slice(2);
  const opt = { withCrop: false, dryRun: false, model: "gemini-nano-banana-2.1", size: "1K", ids: [] as string[] };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--with-crop") opt.withCrop = true;
    else if (args[i] === "--dry-run") opt.dryRun = true;
    else if (args[i] === "--model") opt.model = args[++i];
    else if (args[i] === "--size") opt.size = args[++i];
    else opt.ids.push(args[i]);
  }
  return opt;
}

function castLooks(): Record<string, string> {
  const readme = readFileSync(join(dir, "README.md"), "utf8");
  const looks: Record<string, string> = {};
  for (const m of readme.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \|$/gm)) looks[m[1]] = m[2];
  return looks;
}

function findEntry(id: string): Entry {
  const [lesson, index] = id.split("#");
  const unit = lesson.split("-")[0].slice(1);
  const plan = JSON.parse(readFileSync(join(dir, `plan/unit${unit}.json`), "utf8"));
  const entry = plan.items.find((e: Entry) => e.lesson === lesson && e.exercise === Number(index));
  if (!entry) throw new Error(`No plan entry ${id}`);
  return entry.reuse ? { ...findEntry(entry.reuse), book: entry.book } : entry;
}

const image = (path: string) => ({
  file: path,
  inline_data: { mime_type: "image/jpeg", data: readFileSync(path).toString("base64") },
});

function buildParts(entry: Entry, withCrop: boolean) {
  const looks = castLooks();
  const cast = Object.entries(looks)
    .filter(([name]) => entry.picture!.toLowerCase().includes(name.toLowerCase()))
    .map(([name, look]) => `- ${name}: ${look}`);
  const crop = Array.isArray(entry.book) ? entry.book[0] : entry.book;
  const parts: object[] = [
    {
      text:
        "You illustrate a language-learning app for adults learning Slovak. " +
        "Draw ONE illustration in the visual style of the first three reference images: textured gouache and coloured pencil, " +
        "visible paper grain and hand-drawn hatching, an earthy, muted palette with warm red-orange accents, naive and expressive figures. " +
        "Take only the style from them. Do not copy their characters, objects or compositions.",
    },
    ...STYLE_REFS.map((f) => image(join(dir, "style-refs", f))),
  ];
  if (withCrop && crop) {
    parts.push(
      { text: "The next image shows the situation as a layout reference. Redraw the situation in the style above." },
      image(join(dir, crop.crop)),
    );
  }
  parts.push({
    text: [
      `Scene: ${entry.picture}`,
      cast.length ? `Characters (keep these looks exactly):\n${cast.join("\n")}` : "",
      "Rules: no text, letters, numbers, signs or speech bubbles anywhere in the picture. One single scene, no panels or borders. " +
        "Keep the background simple so the people and the action read clearly at small sizes. " +
        "Paint it as a vignette on plain white paper: the painting fades out at every side in soft, irregular, brushy edges, " +
        "with clean white paper all around it. No rectangular frame, no hard edge, nothing touching the borders of the image.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
  return parts;
}

async function render(id: string, opt: ReturnType<typeof parseArgs>) {
  const entry = findEntry(id);
  const parts = buildParts(entry, opt.withCrop);
  if (opt.dryRun) {
    console.log(`--- ${id}${opt.withCrop ? " (with crop)" : ""}`);
    for (const p of parts as any[]) console.log(p.text ?? `[image ${p.file.replace(`${dir}/`, "")}]`);
    return 0;
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${opt.model}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: (parts as any[]).map(({ file: _file, ...part }) => part) }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: opt.size } },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`${id}: ${res.status} ${data.error?.message ?? ""}`);
  const out = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!out) throw new Error(`${id}: no image (${data.candidates?.[0]?.finishReason ?? "no candidate"})`);
  const name = `${id.replace("#", "-")}${opt.withCrop ? "-crop" : ""}`;
  const ext = out.inlineData.mimeType === "image/png" ? "png" : "jpg";
  writeFileSync(join(dir, "test-renders", `${name}.${ext}`), Buffer.from(out.inlineData.data, "base64"));
  const usage = data.usageMetadata ?? {};
  const price = PRICES[opt.model];
  const imageTokens = (usage.candidatesTokensDetails ?? []).find((d: any) => d.modality === "IMAGE")?.tokenCount ?? 0;
  const textTokens = (usage.candidatesTokenCount ?? 0) - imageTokens + (usage.thoughtsTokenCount ?? 0);
  const cost = price
    ? ((usage.promptTokenCount ?? 0) * price.input + textTokens * price.text) / 1e6 + (price.image[opt.size] ?? 0)
    : NaN;
  const details = (list?: { modality: string; tokenCount: number }[]) =>
    (list ?? []).map((d) => `${d.modality.toLowerCase()} ${d.tokenCount}`).join(", ");
  console.log(
    `${name}.${ext}  input ${usage.promptTokenCount} (${details(usage.promptTokensDetails)}), ` +
      `output ${usage.candidatesTokenCount} (${details(usage.candidatesTokensDetails)})` +
      `${usage.thoughtsTokenCount ? `, thinking ${usage.thoughtsTokenCount}` : ""}, ≈ $${cost.toFixed(4)}`,
  );
  return cost;
}

async function main() {
  const opt = parseArgs();
  if (!process.env.GEMINI_API_KEY && !opt.dryRun) throw new Error("GEMINI_API_KEY is not set (.env.local)");
  mkdirSync(join(dir, "test-renders"), { recursive: true });
  const costs = await Promise.all(opt.ids.map((id) => render(id, opt).catch((e) => (console.error(e.message), 0))));
  console.log(`total ≈ $${costs.reduce((a, b) => a + b, 0).toFixed(4)} (${opt.model}, ${opt.size})`);
}
main();
