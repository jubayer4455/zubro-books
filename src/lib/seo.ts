import { ZubroBook, ZubroSettings } from "./supabase";

export const SITE_URL = "https://zubrobooks.vercel.app";

export interface CategorySeoMeta {
  slug: string;
  label: string;
  title: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_SEO: Record<string, CategorySeoMeta> = {
  horror: {
    slug: "horror",
    label: "অতিপ্রাকৃত ও হরর",
    title: "বাংলা হরর ও অতিপ্রাকৃত গল্প — ZUBRO ডিজিটাল বইঘর",
    description:
      "গা ছমছমে বাংলা হরর গল্প, ভৌতিক অভিজ্ঞতা ও অতিপ্রাকৃত রহস্যের পূর্ণাঙ্গ বই সংকলন পড়ুন ZUBRO-তে।",
    keywords: [
      "বাংলা হরর গল্প",
      "ভূতের গল্প",
      "অতিপ্রাকৃত গল্প",
      "bangla horror story",
      "bhuter golpo",
      "ZUBRO horror",
    ],
  },
  masterpiece: {
    slug: "masterpiece",
    label: "মাস্টারপিস আখ্যান",
    title: "বাংলা মাস্টারপিস বড় গল্প ও জীবনমুখী আখ্যান — ZUBRO",
    description:
      "হৃদয়স্পর্শী বাংলা বড় গল্প, মানবিক আখ্যান ও রাতের নিস্তব্ধতায় ডুবে যাওয়ার মতো সাহিত্য সংকলন।",
    keywords: [
      "বাংলা বড় গল্প",
      "মাস্টারপিস গল্প",
      "জীবনমুখী বাংলা গল্প",
      "bangla golpo",
      "bangla emotional story",
      "ZUBRO",
    ],
  },
  love: {
    slug: "love",
    label: "প্রেম ও সংসার",
    title: "বাংলা প্রেম, বিয়ে ও সংসারের গল্প — ZUBRO ডিজিটাল বইঘর",
    description:
      "ভালোবাসা, অভিমান, মধ্যবিত্ত সংসার ও সম্পর্কের না বলা অনুভূতির বাংলা গল্প ও উপন্যাস পড়ুন ZUBRO-তে।",
    keywords: [
      "বাংলা ভালোবাসার গল্প",
      "প্রেমের গল্প",
      "বিয়ের গল্প",
      "সংসারের গল্প",
      "bangla romantic golpo",
      "valobashar golpo",
    ],
  },
  thriller: {
    slug: "thriller",
    label: "রহস্য ও থ্রিলার",
    title: "বাংলা রহস্য ও থ্রিলার গল্প — ZUBRO ডিজিটাল বইঘর",
    description:
      "শ্বাসরুদ্ধকর বাংলা থ্রিলার, পুরনো ডায়েরির রহস্য ও মফস্বলের অমীমাংসিত ঘটনার গল্প পড়ুন বইয়ের পাতায়।",
    keywords: [
      "বাংলা থ্রিলার গল্প",
      "রহস্য গল্প",
      "গোয়েন্দা ও রহস্য উপন্যাস",
      "bangla thriller story",
      "rohossho golpo",
    ],
  },
  series: {
    slug: "series",
    label: "ধারাবাহিক উপন্যাস",
    title: "বাংলা ধারাবাহিক উপন্যাস সংকলন — ZUBRO ডিজিটাল বইঘর",
    description:
      "প্রতি শুক্রবার প্রকাশিত চার পর্বের পূর্ণাঙ্গ বাংলা ধারাবাহিক উপন্যাস এক মলাটে পড়ুন ZUBRO বইঘরে।",
    keywords: [
      "বাংলা ধারাবাহিক উপন্যাস",
      "বাংলা উপন্যাস অনলাইন",
      "পর্বভিত্তিক গল্প",
      "bangla novel online",
      "dharabahik upanyas",
    ],
  },
};

export function buildBookKeywords(book: {
  title: string;
  subtitle?: string;
  category?: string;
  category_label?: string;
}): string[] {
  const catMeta = CATEGORY_SEO[book.category || "masterpiece"] || CATEGORY_SEO.masterpiece;
  const titleWords = String(book.title || "")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  return Array.from(
    new Set([
      book.title,
      `${book.title} গল্প`,
      `${book.title} ZUBRO`,
      book.category_label || "বাংলা গল্প",
      ...titleWords,
      ...catMeta.keywords,
      "ZUBRO",
      "জুব্রো",
      "না বলা কথা ও জীবনের গল্প",
      "বাংলা গল্পের বই",
      "bangla story book online",
    ])
  );
}

export function buildWebsiteJsonLd(books: ZubroBook[], settings: ZubroSettings) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: `${settings.site_title} — ${settings.site_tagline}`,
      alternateName: ["ZUBRO", "জুব্রো", "ZUBRO Books"],
      url: SITE_URL,
      inLanguage: "bn-BD",
      description: settings.hero_description,
      publisher: {
        "@type": "Organization",
        name: settings.site_title,
        url: SITE_URL,
        sameAs: settings.facebook_page_url ? [settings.facebook_page_url] : [],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${settings.site_title} — ${settings.site_tagline}`,
      url: SITE_URL,
      inLanguage: "bn-BD",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: books.length,
        itemListElement: books.slice(0, 20).map((b, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/book/${b.slug}`,
          name: b.title,
        })),
      },
    },
  ];
}

export function buildBookJsonLd(book: ZubroBook) {
  const wordCount = String(book.content || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const bookUrl = `${SITE_URL}/book/${book.slug}`;
  const coverUrl = `${SITE_URL}/api/cover/${book.slug}?ed=2`;
  const catSlug = CATEGORY_SEO[book.category] ? book.category : "masterpiece";

  return [
    {
      "@context": "https://schema.org",
      "@type": "Book",
      name: book.title,
      headline: book.title,
      alternativeHeadline: book.subtitle || undefined,
      description: book.excerpt || book.subtitle || book.title,
      url: bookUrl,
      mainEntityOfPage: bookUrl,
      image: [coverUrl],
      inLanguage: "bn-BD",
      bookFormat: "https://schema.org/EBook",
      genre: book.category_label || "বাংলা কথাসাহিত্য",
      numberOfPages: Math.max(4, Math.ceil(wordCount / 250)),
      wordCount,
      timeRequired: `PT${Math.max(2, book.reading_time_minutes || 6)}M`,
      datePublished: book.published_at,
      dateModified: book.published_at,
      isAccessibleForFree: true,
      author: {
        "@type": "Organization",
        name: "ZUBRO",
        url: SITE_URL,
      },
      publisher: {
        "@type": "Organization",
        name: "ZUBRO — না বলা কথা ও জীবনের গল্প",
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "ZUBRO গ্রন্থশালা",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: book.category_label || "বাংলা গল্প",
          item: `${SITE_URL}/category/${catSlug}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: book.title,
          item: bookUrl,
        },
      ],
    },
  ];
}
