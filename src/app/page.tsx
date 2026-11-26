import React from "react";
import {
  DEFAULT_SETTINGS,
  getSupabaseClient,
  ZubroBook,
  ZubroSettings,
} from "@/lib/supabase";
import { buildWebsiteJsonLd } from "@/lib/seo";
import BookShelfClient from "@/components/BookShelfClient";

export const revalidate = 30;

export default async function HomePage() {
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

  const jsonLd = buildWebsiteJsonLd(books, settings);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BookShelfClient books={books} settings={settings} />
    </>
  );
}
