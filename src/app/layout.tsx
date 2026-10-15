import type { Metadata, Viewport } from "next";
import { Literata, Onest } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

// latin-ext covers Slovak letters like ľ, ĺ, ŕ, ď, ť, ň, ô; cyrillic covers
// Ukrainian and Russian. Literata sets Slovak text and headings, Onest the
// interface.
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: { default: "Slovko · Learn Slovak", template: "%s · Slovko" },
  description: "Learn Slovak with short, playful lessons, real voice audio and speaking practice.",
};

export const viewport: Viewport = {
  themeColor: "#faf9f5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${literata.variable} ${onest.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
