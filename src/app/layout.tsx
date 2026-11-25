import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Hind_Siliguri,
  Noto_Serif_Bengali,
  Tiro_Bangla,
} from "next/font/google";
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

export const metadata: Metadata = {
  title: "ZUBRO — না বলা কথা ও জীবনের গল্প",
  description:
    "ZUBRO পেজের দীর্ঘ আখ্যান, জীবনমুখী গল্প ও অতিপ্রাকৃত রহস্যের ডিজিটাল গ্রন্থশালা।",
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
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
