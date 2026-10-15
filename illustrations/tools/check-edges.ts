// Finds renders whose painting runs into the image border instead of fading out
// on white paper. Those get a brush-edge mask in the app (see .illustration-edge).
// Usage: npx tsx illustrations/tools/check-edges.ts [files…]   (default: illustrations/renders/*)
// Prints, per side, the share of "paint" (non-paper) pixels in a thin strip along
// the border; a picture is flagged when any side is above THRESHOLD.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const BAND = 0.015; // strip width, as a share of the side
const THRESHOLD = 0.12; // share of paint pixels that counts as touching the border

function paintShare(file: string, crop: string): number {
  // Pixels darker than 88% grey are paint; paper is near white.
  const out = execFileSync("magick", [
    file, "-crop", crop, "+repage", "-colorspace", "gray", "-threshold", "88%", "-format", "%[fx:1-mean]", "info:",
  ]);
  return Number(out.toString());
}

export function edgeShares(file: string): Record<"top" | "bottom" | "left" | "right", number> {
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", file]).toString().split(" ").map(Number);
  const bx = Math.max(2, Math.round(w * BAND));
  const by = Math.max(2, Math.round(h * BAND));
  return {
    top: paintShare(file, `${w}x${by}+0+0`),
    bottom: paintShare(file, `${w}x${by}+0+${h - by}`),
    left: paintShare(file, `${bx}x${h}+0+0`),
    right: paintShare(file, `${bx}x${h}+${w - bx}+0`),
  };
}

export const touchesBorder = (shares: Record<string, number>) => Object.values(shares).some((s) => s > THRESHOLD);

if (process.argv[1]?.endsWith("check-edges.ts")) {
  const dir = join(process.cwd(), "illustrations/renders");
  const files = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync(dir).filter((f) => /\.(jpg|png)$/.test(f)).map((f) => join(dir, f));
  let flagged = 0;
  for (const file of files.sort()) {
    const shares = edgeShares(file);
    const bad = touchesBorder(shares);
    if (bad) flagged++;
    const pct = Object.entries(shares).map(([side, s]) => `${side} ${(s * 100).toFixed(0)}%`).join("  ");
    console.log(`${bad ? "✗" : "✓"} ${file.split("/").pop()}  ${pct}`);
  }
  console.log(`${flagged} of ${files.length} touch the border`);
}
