import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseClient, ZubroBook } from "@/lib/supabase";
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

  return {
    title: `${book.title} — ZUBRO`,
    description: book.excerpt || book.subtitle || "ZUBRO ডিজিটাল গল্পের বইঘর",
    openGraph: {
      title: `${book.title} — ZUBRO`,
      description: book.excerpt || book.subtitle,
      images: book.cover_image_url ? [book.cover_image_url] : [],
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

  const { data: related } = await supabase
    .from("zubro_books")
    .select("*")
    .eq("is_published", true)
    .eq("is_archived", false)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <BookReaderView
      book={book as ZubroBook}
      moreBooks={(related || []) as ZubroBook[]}
    />
  );
}
