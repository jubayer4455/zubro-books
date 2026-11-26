import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "সম্পাদনা দপ্তর — ZUBRO",
  alternates: {
    canonical: "https://zubrobooks.vercel.app/admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
