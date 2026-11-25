"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Moon, Search, Sun } from "lucide-react";
import { ZubroBook, ZubroSettings } from "@/lib/supabase";
import { formatBanglaDate, toBanglaNumber } from "@/lib/chapters";
import BookCoverArtwork from "./BookCoverArtwork";

const CATEGORIES = [
  { id: "all", label: "সব গ্রন্থ" },
  { id: "masterpiece", label: "মাস্টারপিস আখ্যান" },
  { id: "horror", label: "অতিপ্রাকৃত ও হরর" },
  { id: "love", label: "প্রেম ও সংসার" },
  { id: "thriller", label: "রহস্য ও থ্রিলার" },
];

export default function BookShelfClient({
  books,
  settings,
}: {
  books: ZubroBook[];
  settings: ZubroSettings;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [surface, setSurface] = useState<"paper" | "night">("paper");

  useEffect(() => {
    const saved = localStorage.getItem("zubro_surface");
    if (saved === "night" || saved === "paper") {
      setSurface(saved);
      document.documentElement.dataset.surface = saved;
    } else {
      document.documentElement.dataset.surface = "paper";
    }
  }, []);

  const toggleSurface = () => {
    const next = surface === "paper" ? "night" : "paper";
    setSurface(next);
    localStorage.setItem("zubro_surface", next);
    document.documentElement.dataset.surface = next;
  };

  const featuredBook = useMemo(() => {
    return books.find((b) => b.is_featured) || books[0] || null;
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const catMatch =
        activeCategory === "all" ||
        b.category === activeCategory ||
        (activeCategory === "masterpiece" &&
          ["masterpiece", "love", "thriller", "mystery"].includes(b.category));

      if (!catMatch) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.subtitle.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.content.toLowerCase().includes(q)
      );
    });
  }, [books, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen paper-grain flex flex-col">
      {/* Optional Editorial Notice Strip */}
      {settings.announcement && (
        <div className="border-b border-[var(--rule-hairline)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] text-xs sm:text-sm py-2 px-4 text-center font-serifBn">
          {settings.announcement}
        </div>
      )}

      {/* Literary Publication Masthead */}
      <header className="bg-[var(--bg-canvas)]/95 sticky top-0 z-40 backdrop-blur-sm border-b border-[var(--rule-hairline)]">
        {/* Folio Utility Strip */}
        <div className="border-b border-[var(--rule-hairline)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-[11px] sm:text-xs text-[var(--ink-muted)]">
            <div className="flex items-center gap-2">
              <span>গ্রন্থশালা সংকলন</span>
              <span>·</span>
              <span>মোট {toBanglaNumber(books.length)}টি বই</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={toggleSurface}
                className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
                title="পটভূমির রঙ পরিবর্তন করুন"
              >
                {surface === "paper" ? (
                  <>
                    <Moon className="w-3.5 h-3.5" />
                    <span>নিশিরাত</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5" />
                    <span>কাগজের রঙ</span>
                  </>
                )}
              </button>

              <a
                href={settings.facebook_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--ink-secondary)] hover:text-[var(--accent-ink)] transition-colors"
              >
                <span>ফেসবুক পাতা</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Classic Editorial Wordmark */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
          <Link href="/" className="group inline-flex items-baseline gap-3.5">
            <span className="font-masthead text-2xl sm:text-3xl font-semibold tracking-[0.26em] text-[var(--ink-primary)] group-hover:text-[var(--accent-ink)] transition-colors">
              {settings.site_title}
            </span>
            <span className="hidden sm:inline-block w-5 h-[1px] bg-[var(--rule-hairline)] align-middle" />
            <span className="font-displayBn text-sm sm:text-base text-[var(--ink-secondary)]">
              {settings.site_tagline}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs tracking-wide text-[var(--ink-secondary)]">
            <a href="#bookshelf" className="hover:text-[var(--ink-primary)] transition-colors">
              গ্রন্থতালিকা
            </a>
            {featuredBook && (
              <Link
                href={`/book/${featuredBook.slug}`}
                className="hover:text-[var(--accent-ink)] transition-colors"
              >
                সর্বশেষ সংযোজন
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Lead Book Editorial Feature */}
      {featuredBook ? (
        <section className="bg-[var(--bg-sheet)] border-b border-[var(--rule-hairline)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              {/* Physical Book Pedestal */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[320px] sm:max-w-[360px] bg-[var(--bg-subtle)]/55 border border-[var(--rule-hairline)] px-9 py-9 sm:px-12 sm:py-11 flex justify-center">
                  <Link
                    href={`/book/${featuredBook.slug}`}
                    className="w-48 sm:w-60 block"
                  >
                    <BookCoverArtwork book={featuredBook} size="lg" />
                  </Link>
                </div>
              </div>

              {/* Editorial Story Introduction */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3 text-xs tracking-[0.14em] text-[var(--accent-ink)] font-medium">
                  <span>নির্বাচিত আখ্যান</span>
                  <span className="w-6 h-[1px] bg-[var(--accent-ink)] opacity-60" />
                  <span>{featuredBook.category_label}</span>
                </div>

                <h1 className="font-displayBn text-3xl sm:text-5xl text-[var(--ink-primary)] leading-[1.22]">
                  <Link
                    href={`/book/${featuredBook.slug}`}
                    className="hover:text-[var(--accent-ink)] transition-colors"
                  >
                    {featuredBook.title}
                  </Link>
                </h1>

                {featuredBook.subtitle && (
                  <p className="font-serifBn text-base sm:text-lg text-[var(--ink-secondary)] leading-relaxed">
                    {featuredBook.subtitle}
                  </p>
                )}

                <blockquote className="border-l-2 border-[var(--accent-ink)] pl-4 sm:pl-5 py-0.5 font-serifBn text-sm sm:text-[16px] text-[var(--ink-secondary)] leading-[1.95] line-clamp-3">
                  {featuredBook.excerpt || featuredBook.content.slice(0, 240) + "..."}
                </blockquote>

                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)] border-t border-[var(--rule-hairline)]">
                  <span className="pt-3">
                    পাঠসময় {toBanglaNumber(featuredBook.reading_time_minutes)} মিনিট
                  </span>
                  <span className="pt-3">·</span>
                  <span className="pt-3">
                    প্রকাশকাল {formatBanglaDate(featuredBook.published_at)}
                  </span>
                  {featuredBook.views_count > 0 && (
                    <>
                      <span className="pt-3">·</span>
                      <span className="pt-3">
                        পঠিত {toBanglaNumber(featuredBook.views_count)} বার
                      </span>
                    </>
                  )}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href={`/book/${featuredBook.slug}`}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-[2px] bg-[var(--ink-primary)] text-[var(--bg-canvas)] hover:bg-[var(--accent-ink)] text-sm font-medium transition-colors"
                  >
                    <span>বইটি খুলে পড়ুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#bookshelf"
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] underline underline-offset-4 decoration-[var(--rule-hairline)] hover:decoration-[var(--ink-primary)] transition-colors"
                  >
                    সম্পূর্ণ সংগ্রহ ({toBanglaNumber(books.length)})
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-[var(--bg-sheet)] border-b border-[var(--rule-hairline)] py-16 px-4 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <p className="text-xs tracking-[0.18em] text-[var(--accent-ink)]">
              {settings.hero_badge}
            </p>
            <h1 className="font-displayBn text-3xl sm:text-4xl text-[var(--ink-primary)]">
              {settings.site_title} — {settings.site_tagline}
            </h1>
            <p className="font-serifBn text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
              {settings.hero_description}
            </p>
          </div>
        </section>
      )}

      {/* Main Archive & Bookshelf */}
      <main
        id="bookshelf"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        {/* Editorial Category Index & Catalog Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[var(--rule-hairline)] pb-0 mb-10 sm:mb-14">
          <div className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`pb-3.5 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? "border-[var(--accent-ink)] text-[var(--ink-primary)] font-semibold"
                      : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64 pb-2.5">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-0 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিরোনাম বা শব্দ দিয়ে খুঁজুন..."
              className="w-full pl-6 pr-2 py-1.5 bg-transparent border-b border-[var(--rule-hairline)] focus:border-[var(--ink-primary)] focus:outline-none text-xs sm:text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
            />
          </div>
        </div>

        {/* Bookshelf Grid */}
        {filteredBooks.length === 0 ? (
          <div className="py-20 text-center border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] px-4">
            <p className="font-displayBn text-xl text-[var(--ink-primary)]">
              এই বিভাগে এখনো কোনো বই সংযোজিত হয়নি।
            </p>
            <p className="font-serifBn text-sm text-[var(--ink-muted)] mt-2">
              ফেসবুক পাতায় নতুন দীর্ঘ গল্প প্রকাশিত হলেই স্বয়ংক্রিয়ভাবে এখানে গ্রন্থাকারে যুক্ত হবে।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 sm:gap-x-9 sm:gap-y-14">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.slug}`}
                className="group flex flex-col"
              >
                {/* Shelf Pedestal */}
                <div className="pb-4 border-b border-[var(--rule-hairline)]">
                  <BookCoverArtwork book={book} size="md" />
                </div>

                {/* Editorial Caption Below Shelf */}
                <div className="pt-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                    <span className="text-[var(--accent-ink)] font-medium">
                      {book.category_label}
                    </span>
                    <span>{toBanglaNumber(book.reading_time_minutes)} মিনিট</span>
                  </div>

                  <h2 className="font-displayBn text-lg sm:text-[21px] leading-[1.3] text-[var(--ink-primary)] group-hover:text-[var(--accent-ink)] transition-colors line-clamp-2">
                    {book.title}
                  </h2>

                  <p className="font-serifBn text-xs sm:text-[13px] text-[var(--ink-secondary)] line-clamp-2 leading-[1.75]">
                    {book.excerpt || book.content.slice(0, 110) + "..."}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Classic Literary Colophon Footer */}
      <footer className="border-t border-[var(--rule-hairline)] bg-[var(--bg-sheet)] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--ink-muted)]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="font-masthead text-sm tracking-[0.24em] font-semibold text-[var(--ink-primary)]">
              {settings.site_title}
            </span>
            <span className="hidden sm:inline">—</span>
            <span className="font-serifBn">{settings.site_tagline}</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href={settings.facebook_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--accent-ink)] transition-colors"
            >
              ফেসবুক পাতা
            </a>
            <Link
              href="/admin"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              সম্পাদনা দপ্তর
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
