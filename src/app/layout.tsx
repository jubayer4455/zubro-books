import type { Metadata } from "next";
import { Hind_Siliguri, Noto_Serif_Bengali } from "next/font/google";
import "./globals.css";

const sansBn = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-bn",
  display: "swap",
});

const serifBn = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif-bn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZUBRO — না বলা কথা ও জীবনের গল্প",
  description:
    "ZUBRO পেজের মাস্টারপিস ও অতিপ্রাকৃত হরর গল্পের ডিজিটাল বইঘর। প্রতিটি গল্প একেকটি বই।",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${sansBn.variable} ${serifBn.variable}`}>
      <body className="min-h-screen antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
