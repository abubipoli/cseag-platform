import type { Metadata } from "next";
import { Inter, Playfair_Display, Manrope } from "next/font/google";
import { SITE_CONFIG } from "@/lib/constants";
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

const SITE_URL = `https://${SITE_CONFIG.domain}`;
const DEFAULT_DESCRIPTION =
  "The Cyber Security Experts Association of Ghana (CSEAG) — membership, expert directory, training, and resources for a safer digital Ghana.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CSEAG — Cyber Security Experts Association of Ghana",
    template: "%s · CSEAG",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "CSEAG",
    "Cyber Security Experts Association of Ghana",
    "cybersecurity Ghana",
    "cybersecurity experts Ghana",
    "cybersecurity association Ghana",
    "cybersecurity training Ghana",
    "IT security professionals Ghana",
  ],
  icons: {
    icon: "/brand/cseag-logo.png",
    shortcut: "/brand/cseag-logo.png",
    apple: "/brand/cseag-logo.png",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_CONFIG.fullName,
    title: "CSEAG — Cyber Security Experts Association of Ghana",
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/brand/cseag-logo-full.png", width: 1200, height: 630, alt: SITE_CONFIG.fullName }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CSEAG — Cyber Security Experts Association of Ghana",
    description: DEFAULT_DESCRIPTION,
    images: ["/brand/cseag-logo-full.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_CONFIG.fullName,
  alternateName: SITE_CONFIG.name,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/cseag-logo-full.png`,
  description: DEFAULT_DESCRIPTION,
  email: SITE_CONFIG.email,
  telephone: SITE_CONFIG.phoneHref,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.address,
    addressCountry: "GH",
  },
  sameAs: Object.values(SITE_CONFIG.socials),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.variable} ${playfairDisplay.variable} ${manrope.variable}`}>
      <body className="flex min-h-full flex-col bg-white text-slate-700">
        {/* eslint-disable-next-line react/no-danger -- static JSON-LD built from server-side constants, not user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
