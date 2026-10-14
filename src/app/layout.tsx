import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AppProvider } from "@/components/app-provider";
import "./globals.css";

// latin-ext covers Slovak letters like ľ, ĺ, ŕ, ď, ť, ň, ô; cyrillic covers
// Ukrainian and Russian.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

export const metadata: Metadata = {
  title: { default: "Slovko · Learn Slovak", template: "%s · Slovko" },
  description: "Learn Slovak with short, playful lessons, real voice audio and speaking practice.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111722" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
