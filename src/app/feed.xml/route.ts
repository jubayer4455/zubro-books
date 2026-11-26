import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const revalidate = 60;

function escapeXml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = getSupabaseClient();
  const { data: books } = await supabase
    .from("zubro_books")
    .select("slug, title, subtitle, excerpt, category_label, published_at")
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("published_at", { ascending: false })
    .limit(50);

  const itemsXml = (books || [])
    .map((b) => {
      const url = `https://zubrobooks.vercel.app/book/${encodeURIComponent(b.slug)}`;
      const pubDate = b.published_at
        ? new Date(b.published_at).toUTCString()
        : new Date().toUTCString();
      const desc = b.excerpt || b.subtitle || b.title;
      return `    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <category>${escapeXml(b.category_label || "বাংলা গল্প")}</category>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ZUBRO — না বলা কথা ও জীবনের গল্প</title>
    <link>https://zubrobooks.vercel.app</link>
    <description>বাংলা মাস্টারপিস গল্প, অতিপ্রাকৃত হরর, প্রেম ও সংসার এবং ধারাবাহিক উপন্যাসের ডিজিটাল বইঘর।</description>
    <language>bn-BD</language>
    <atom:link href="https://zubrobooks.vercel.app/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
