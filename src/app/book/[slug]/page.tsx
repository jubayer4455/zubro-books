import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSupabaseClient,
  ZubroBook,
  ZubroReaderNote,
} from "@/lib/supabase";
import BookReaderView from "@/components/BookReaderView";

export const revalidate = 30;

export async function generateMetadata(context: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await context.params;
  const supabase = getSupabaseClient();
  const { data: book } = await supabase
    .from("zubro_books")
    .select("title, subtitle, excerpt, cover_image_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();

  if (!book) {
    return { title: "বই পাওয়া যায়নি — ZUBRO" };
  }

  const absCoverUrl = `https://zubrobooks.vercel.app/api/cover/${slug}?ed=2`;
  const desc =
    book.excerpt || book.subtitle || "ZUBRO ডিজিটাল গল্পের গ্রন্থশালা";

  return {
    title: `${book.title} — ZUBRO`,
    description: desc,
    openGraph: {
      type: "book",
      siteName: "ZUBRO — না বলা কথা ও জীবনের গল্প",
      title: `${book.title} — ZUBRO`,
      description: desc,
      url: `https://zubrobooks.vercel.app/book/${slug}`,
      images: [
        {
          url: absCoverUrl,
          width: 720,
          height: 1080,
          alt: book.title,
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

  return (
    <BookReaderView
      book={book as ZubroBook}
      moreBooks={(related || []) as ZubroBook[]}
      initialNotes={(notes || []) as ZubroReaderNote[]}
    />
  );
}
