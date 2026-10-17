import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Literata, Noto_Sans_Georgian, Noto_Serif_Georgian, Onest } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

// latin-ext covers Slovak letters like ľ, ĺ, ŕ, ď, ť, ň, ô (and Uzbek); cyrillic
// covers Ukrainian and Russian. Literata sets Slovak text and headings, Onest the
// interface.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});
// Typed Slovak answers: every letter the same width, so a hint's letter cells line up
// with whatever is typed. Only lessons use it, so it isn't preloaded on every page.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  preload: false,
});
// Neither has Georgian letters: Noto fills in for them (their font files cover
// only the Georgian range, so other pages never download them).
const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-sans-georgian",
  subsets: ["georgian"],
  preload: false,
});
const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-serif-georgian",
  subsets: ["georgian"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Slovko · Learn Slovak", template: "%s · Slovko" },
  description: "Learn Slovak with short, playful lessons, real voice audio and speaking practice.",
};

export const viewport: Viewport = {
  themeColor: "#fbf8f1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${literata.variable} ${onest.variable} ${notoSansGeorgian.variable} ${notoSerifGeorgian.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
