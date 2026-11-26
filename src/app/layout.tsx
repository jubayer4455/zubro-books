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
  title: {
    default: "ZUBRO — না বলা কথা ও জীবনের গল্প | বাংলা গল্প ও উপন্যাসের ডিজিটাল বইঘর",
    template: "%s",
  },
  description:
    "ZUBRO পেজের দীর্ঘ বাংলা মাস্টারপিস গল্প, অতিপ্রাকৃত হরর, প্রেম ও সংসার, রহস্য থ্রিলার এবং ধারাবাহিক উপন্যাসের ডিজিটাল বইঘর। বইয়ের পাতার মতো আরামে বিনামূল্যে পড়ুন।",
  keywords: [
    "ZUBRO",
    "জুব্রো",
    "বাংলা গল্প",
    "বাংলা হরর গল্প",
    "ভূতের গল্প",
    "বাংলা ভালোবাসার গল্প",
    "বাংলা রহস্য ও থ্রিলার গল্প",
    "বাংলা ধারাবাহিক উপন্যাস",
    "না বলা কথা ও জীবনের গল্প",
    "bangla golpo",
    "bangla horror story",
    "bangla thriller golpo",
    "bangla upanyas online",
    "zubro books",
  ],
  authors: [{ name: "ZUBRO", url: "https://zubrobooks.vercel.app" }],
  creator: "ZUBRO",
  publisher: "ZUBRO",
  category: "books",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "https://zubrobooks.vercel.app",
    types: {
      "application/rss+xml": "https://zubrobooks.vercel.app/feed.xml",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
    locale: "bn_BD",
    siteName: "ZUBRO — না বলা কথা ও জীবনের গল্প",
    title: "ZUBRO — না বলা কথা ও জীবনের গল্প | বাংলা ডিজিটাল বইঘর",
    description:
      "বাংলা মাস্টারপিস গল্প, গা ছমছমে হরর ও ধারাবাহিক উপন্যাসের ডিজিটাল গ্রন্থশালা। প্রতিটি গল্প একেকটি ছাপা বই।",
    url: "https://zubrobooks.vercel.app",
    images: [
      {
        url: "https://zubrobooks.vercel.app/api/og",
        width: 1200,
        height: 630,
        alt: "ZUBRO — না বলা কথা ও জীবনের গল্প | বাংলা ডিজিটাল বইঘর",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZUBRO — না বলা কথা ও জীবনের গল্প",
    description:
      "বাংলা মাস্টারপিস গল্প, হরর ও ধারাবাহিক উপন্যাসের ডিজিটাল গ্রন্থশালা।",
    images: ["https://zubrobooks.vercel.app/api/og"],
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
