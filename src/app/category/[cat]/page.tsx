import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  DEFAULT_SETTINGS,
  getSupabaseClient,
  ZubroBook,
  ZubroSettings,
} from "@/lib/supabase";
import { CATEGORY_SEO, SITE_URL } from "@/lib/seo";
import BookShelfClient from "@/components/BookShelfClient";

export const revalidate = 30;

export async function generateMetadata(context: {
  params: Promise<{ cat: string }>;
}): Promise<Metadata> {
  const { cat } = await context.params;
  const meta = CATEGORY_SEO[cat];
  if (!meta) {
    return { title: "বিভাগ পাওয়া যায়নি — ZUBRO" };
  }

  const url = `${SITE_URL}/category/${meta.slug}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      siteName: "ZUBRO — না বলা কথা ও জীবনের গল্প",
      title: meta.title,
      description: meta.description,
      url,
      images: [
        {
          url: `${SITE_URL}/api/og`,
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [`${SITE_URL}/api/og`],
    },
  };
}

export default async function CategoryPage(context: {
  params: Promise<{ cat: string }>;
}) {
  const { cat } = await context.params;
  const meta = CATEGORY_SEO[cat];
  if (!meta) {
    notFound();
  }

  const supabase = getSupabaseClient();
  const [{ data: booksData }, { data: settingsData }] = await Promise.all([
    supabase
      .from("zubro_books")
      .select("*")
      .eq("is_published", true)
      .eq("is_archived", false)
      .order("published_at", { ascending: false }),
    supabase.from("zubro_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const books = (booksData || []) as ZubroBook[];
  const settings: ZubroSettings = settingsData
    ? { ...DEFAULT_SETTINGS, ...settingsData }
    : DEFAULT_SETTINGS;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: meta.title,
    description: meta.description,
    url: `${SITE_URL}/category/${meta.slug}`,
    inLanguage: "bn-BD",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookShelfClient
        books={books}
        settings={settings}
        initialCategory={meta.slug}
      />
    </>
  );
}
