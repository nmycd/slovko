/* eslint-disable @typescript-eslint/no-explicit-any -- loose JSON from the Gemini API */
// Shared prompt and API code for rendering planned pictures with Gemini image
// models ("Nano Banana"). Used by render-test.ts and render-plan.ts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const dir = join(process.cwd(), "illustrations");
const STYLE_REFS = ["mdn-013.jpg", "mdn-014.jpg", "mdn-049.jpg"];

// USD per 1M tokens (input, text/thinking output) and per image, from
// ai.google.dev/gemini-api/docs/pricing (October 2026). Only models we've priced.
const PRICES: Record<string, { input: number; text: number; image: Record<string, number> }> = {
  "gemini-nano-banana-2.1": { input: 1.5, text: 7.5, image: { "1K": 0.0336, "2K": 0.0504, "4K": 0.113 } },
  "gemini-3.1-flash-image": { input: 0.5, text: 3, image: { "1K": 0.067, "2K": 0.101, "4K": 0.151 } },
};

export type Part = { text?: string; file?: string; inline_data?: { mime_type: string; data: string } };

/** Cast rows from README.md ("| **Name** | Look |"). */
function castLooks(): Record<string, string> {
  const readme = readFileSync(join(dir, "README.md"), "utf8");
  const looks: Record<string, string> = {};
  for (const m of readme.matchAll(/^\| \*\*(.+?)\*\* \| (.+?) \|$/gm)) looks[m[1]] = m[2];
  return looks;
}

const image = (path: string): Part => ({
  file: path,
  inline_data: { mime_type: "image/jpeg", data: readFileSync(path).toString("base64") },
});

/** The prompt: style references, the scene, the cast's looks and the rules. `crop` is for test comparisons only. */
export function buildParts(picture: string, crop?: string): Part[] {
  const cast = Object.entries(castLooks())
    .filter(([name]) => picture.toLowerCase().includes(name.toLowerCase()))
    .map(([name, look]) => `- ${name}: ${look}`);
  const parts: Part[] = [
    {
      text:
        "You illustrate a language-learning app for adults learning Slovak. " +
        "Draw ONE illustration in the visual style of the first three reference images: textured gouache and coloured pencil, " +
        "visible paper grain and hand-drawn hatching, an earthy, muted palette with warm red-orange accents, naive and expressive figures. " +
        "Take only the style from them. Do not copy their characters, objects or compositions.",
    },
    ...STYLE_REFS.map((f) => image(join(dir, "style-refs", f))),
  ];
  if (crop) {
    parts.push(
      { text: "The next image shows the situation as a layout reference. Redraw the situation in the style above." },
      image(join(dir, crop)),
    );
  }
  parts.push({
    text: [
      `Scene: ${picture}`,
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

/** Prints the prompt without calling the API. */
export function describeParts(parts: Part[]): string {
  return parts.map((p) => p.text ?? `[image ${p.file!.replace(`${dir}/`, "")}]`).join("\n");
}

export class RenderError extends Error {
  constructor(
    message: string,
    /** Worth retrying: rate limits, server errors, a reply without an image. */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export type Render = { data: Buffer; ext: "png" | "jpg"; cost: number; summary: string };

export async function renderImage(parts: Part[], model: string, size: string): Promise<Render> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: parts.map((p) => (p.text ? { text: p.text } : { inline_data: p.inline_data })) }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "4:3", imageSize: size } },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new RenderError(`${res.status} ${data.error?.message ?? ""}`, res.status === 429 || res.status >= 500);
  }
  const out = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!out) throw new RenderError(`no image (${data.candidates?.[0]?.finishReason ?? "no candidate"})`, true);

  const usage = data.usageMetadata ?? {};
  const price = PRICES[model];
  const imageTokens = (usage.candidatesTokensDetails ?? []).find((d: any) => d.modality === "IMAGE")?.tokenCount ?? 0;
  const textTokens = (usage.candidatesTokenCount ?? 0) - imageTokens + (usage.thoughtsTokenCount ?? 0);
  const cost = price
    ? ((usage.promptTokenCount ?? 0) * price.input + textTokens * price.text) / 1e6 + (price.image[size] ?? 0)
    : NaN;
  return {
    data: Buffer.from(out.inlineData.data, "base64"),
    ext: out.inlineData.mimeType === "image/png" ? "png" : "jpg",
    cost,
    summary: `input ${usage.promptTokenCount}, output ${usage.candidatesTokenCount}, thinking ${usage.thoughtsTokenCount ?? 0}, ≈ $${cost.toFixed(4)}`,
  };
}
