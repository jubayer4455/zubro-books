import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/book/", "/category/", "/feed.xml"],
        disallow: ["/admin", "/api/admin"],
      },
    ],
    sitemap: "https://zubrobooks.vercel.app/sitemap.xml",
    host: "https://zubrobooks.vercel.app",
  };
}
