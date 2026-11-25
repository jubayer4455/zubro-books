import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Hind_Siliguri,
  Noto_Serif_Bengali,
  Tiro_Bangla,
} from "next/font/google";
import PwaRegistrar from "@/components/PwaRegistrar";
import "./globals.css";

const sansBn = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-bn",
  display: "swap",
});

const serifBn = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-bn",
  display: "swap",
});

const displayBn = Tiro_Bangla({
  subsets: ["bengali", "latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display-bn",
  display: "swap",
});

const mastheadEn = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-masthead",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#F4EFE6",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zubrobooks.vercel.app"),
  title: "ZUBRO — না বলা কথা ও জীবনের গল্প",
  description:
    "ZUBRO পেজের দীর্ঘ আখ্যান, ধারাবাহিক উপন্যাস, জীবনমুখী গল্প ও অতিপ্রাকৃত রহস্যের ডিজিটাল গ্রন্থশালা।",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ZUBRO",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/api/icon?size=192",
    apple: "/api/icon?size=192",
  },
  openGraph: {
    type: "website",
    siteName: "ZUBRO — না বলা কথা ও জীবনের গল্প",
    title: "ZUBRO — না বলা কথা ও জীবনের গল্প",
    description:
      "ZUBRO পেজের দীর্ঘ আখ্যান, ধারাবাহিক উপন্যাস ও অতিপ্রাকৃত রহস্যের ডিজিটাল গ্রন্থশালা।",
    url: "https://zubrobooks.vercel.app",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${sansBn.variable} ${serifBn.variable} ${displayBn.variable} ${mastheadEn.variable}`}
    >
      <body className="min-h-screen antialiased">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
