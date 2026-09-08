import type { Metadata } from "next";
import { Inter, Playfair_Display, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CSEAG — Cyber Security Experts Association of Ghana",
    template: "%s · CSEAG",
  },
  description:
    "The Cyber Security Experts Association of Ghana (CSEAG) — membership, expert directory, training, and resources for a safer digital Ghana.",
  icons: {
    icon: "/brand/cseag-logo.png",
    shortcut: "/brand/cseag-logo.png",
    apple: "/brand/cseag-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${playfairDisplay.variable} ${manrope.variable}`}>
      <body className="flex min-h-full flex-col bg-white text-slate-700">{children}</body>
    </html>
  );
}
