import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSupabaseClient,
  ZubroBook,
  ZubroReaderNote,
} from "@/lib/supabase";
import { buildBookJsonLd, buildBookKeywords, SITE_URL } from "@/lib/seo";
import BookReaderView from "@/components/BookReaderView";

export const revalidate = 30;

export async function generateMetadata(context: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  const supabase = getSupabaseClient();
  const { data: book } = await supabase
    .from("zubro_books")
    .select(
      "title, subtitle, category, category_label, excerpt, cover_image_url, published_at"
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (!book) {
    return {
      title: "বই পাওয়া যায়নি — ZUBRO",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${SITE_URL}/book/${slug}`;
  const absCoverUrl = `${SITE_URL}/api/cover/${slug}?ed=2`;
  const desc =
    book.excerpt ||
    book.subtitle ||
    `${book.title} — ZUBRO ডিজিটাল বইঘরে বাংলা ${book.category_label || "গল্প"} পড়ুন।`;

  return {
    title: `${book.title} — ${book.category_label || "বাংলা গল্প"} | ZUBRO`,
    description: desc,
    keywords: buildBookKeywords(book),
    authors: [{ name: "ZUBRO", url: SITE_URL }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      locale: "bn_BD",
      siteName: "ZUBRO — না বলা কথা ও জীবনের গল্প",
      title: `${book.title} — ZUBRO`,
      description: desc,
      url: canonicalUrl,
      publishedTime: book.published_at,
      section: book.category_label || "বাংলা গল্প",
      images: [
        {
          url: absCoverUrl,
          width: 720,
          height: 1080,
          alt: `${book.title} — ${book.category_label || "বাংলা গল্প"} বইয়ের প্রচ্ছদ`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} — ZUBRO`,
      description: desc,
      images: [absCoverUrl],
    },
  };
}

export default async function BookDetailPage(context: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await context.params;
  const supabase = getSupabaseClient();

  const { data: book } = await supabase
    .from("zubro_books")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (!book) {
    notFound();
  }

  const [{ data: related }, { data: notes }] = await Promise.all([
    supabase
      .from("zubro_books")
      .select("*")
      .eq("is_published", true)
      .eq("is_archived", false)
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("zubro_reader_notes")
      .select("id, book_slug, reader_name, note_text, created_at")
      .eq("book_slug", slug)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const typedBook = book as ZubroBook;
  const jsonLd = buildBookJsonLd(typedBook);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookReaderView
        book={typedBook}
        moreBooks={(related || []) as ZubroBook[]}
        initialNotes={(notes || []) as ZubroReaderNote[]}
      />
    </>
  );
}
