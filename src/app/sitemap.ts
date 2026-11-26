import type { MetadataRoute } from "next";
import { getSupabaseClient } from "@/lib/supabase";

export const revalidate = 60;

const SITE_URL = "https://zubrobooks.vercel.app";
const CATEGORY_SLUGS = ["horror", "masterpiece", "love", "thriller", "series"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseClient();
  const { data: books } = await supabase
    .from("zubro_books")
    .select("slug, published_at")
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("published_at", { ascending: false });

  const latestDate =
    books && books.length > 0 && books[0].published_at
      ? new Date(books[0].published_at)
      : new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: latestDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...CATEGORY_SLUGS.map((cat) => ({
      url: `${SITE_URL}/category/${cat}`,
      lastModified: latestDate,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })),
  ];

  const bookEntries: MetadataRoute.Sitemap = (books || []).map((b) => ({
    url: `${SITE_URL}/book/${b.slug}`,
    lastModified: b.published_at ? new Date(b.published_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...bookEntries];
}
