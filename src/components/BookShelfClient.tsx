"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Download,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { ZubroBook, ZubroSettings } from "@/lib/supabase";
import { formatBanglaDate, toBanglaNumber } from "@/lib/chapters";
import BookCoverArtwork from "./BookCoverArtwork";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface SavedProgress {
  chapterIndex: number;
  totalChapters: number;
  pct: number;
  updatedAt: number;
}

const CATEGORIES = [
  { id: "all", label: "সব গ্রন্থ" },
  { id: "series", label: "ধারাবাহিক উপন্যাস" },
  { id: "masterpiece", label: "মাস্টারপিস আখ্যান" },
  { id: "horror", label: "অতিপ্রাকৃত ও হরর" },
  { id: "love", label: "প্রেম ও সংসার" },
  { id: "thriller", label: "রহস্য ও থ্রিলার" },
  { id: "saved", label: "সংরক্ষিত বই" },
];

export default function BookShelfClient({
  books,
  settings,
  initialCategory = "all",
}: {
  books: ZubroBook[];
  settings: ZubroSettings;
  initialCategory?: string;
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [surface, setSurface] = useState<"paper" | "night">("paper");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, SavedProgress>>(
    {}
  );
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const savedSurface = localStorage.getItem("zubro_surface");
    if (savedSurface === "night" || savedSurface === "paper") {
      setSurface(savedSurface);
      document.documentElement.dataset.surface = savedSurface;
    } else {
      document.documentElement.dataset.surface = "paper";
    }

    try {
      const bm = JSON.parse(localStorage.getItem("zubro_bookmarks") || "[]");
      if (Array.isArray(bm)) setBookmarks(bm);
    } catch {}

    try {
      const pr = JSON.parse(localStorage.getItem("zubro_progress") || "{}");
      if (pr && typeof pr === "object") setProgressMap(pr);
    } catch {}

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const toggleSurface = () => {
    const next = surface === "paper" ? "night" : "paper";
    setSurface(next);
    localStorage.setItem("zubro_surface", next);
    document.documentElement.dataset.surface = next;
  };

  const toggleBookmark = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarks((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug];
      localStorage.setItem("zubro_bookmarks", JSON.stringify(next));
      return next;
    });
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const featuredBook = useMemo(() => {
    return books.find((b) => b.is_featured) || books[0] || null;
  }, [books]);

  const continueReadingItem = useMemo(() => {
    let latestSlug = "";
    let latestTime = 0;
    for (const [slug, info] of Object.entries(progressMap)) {
      if (info && info.pct > 0 && info.pct < 100 && info.updatedAt > latestTime) {
        latestSlug = slug;
        latestTime = info.updatedAt;
      }
    }
    if (!latestSlug) return null;
    const book = books.find((b) => b.slug === latestSlug);
    if (!book) return null;
    return { book, progress: progressMap[latestSlug] };
  }, [books, progressMap]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      let catMatch = false;
      if (activeCategory === "all") {
        catMatch = true;
      } else if (activeCategory === "saved") {
        catMatch = bookmarks.includes(b.slug);
      } else if (activeCategory === "series") {
        catMatch = Boolean(b.is_series) || b.category === "series";
      } else if (activeCategory === "masterpiece") {
        catMatch = ["masterpiece", "love", "thriller", "mystery"].includes(
          b.category
        );
      } else {
        catMatch = b.category === activeCategory;
      }

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
  }, [books, activeCategory, searchQuery, bookmarks]);

  return (
    <div className="min-h-screen paper-grain flex flex-col">
      {settings.announcement && (
        <div className="border-b border-[var(--rule-hairline)] bg-[var(--bg-subtle)] text-[var(--ink-primary)] text-xs sm:text-sm py-2 px-4 text-center font-serifBn">
          {settings.announcement}
        </div>
      )}

      <header className="bg-[var(--bg-canvas)]/95 sticky top-0 z-40 backdrop-blur-sm border-b border-[var(--rule-hairline)]">
        <div className="border-b border-[var(--rule-hairline)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between text-[11px] sm:text-xs text-[var(--ink-muted)]">
            <div className="flex items-center gap-2">
              <span>গ্রন্থশালা সংকলন</span>
              <span>·</span>
              <span>মোট {toBanglaNumber(books.length)}টি বই</span>
            </div>

            <div className="flex items-center gap-3.5 sm:gap-6">
              {installPrompt && (
                <button
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-1 text-[var(--accent-ink)] font-medium hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>অ্যাপ ইনস্টল</span>
                </button>
              )}

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

          <nav
            aria-label="প্রধান নেভিগেশন"
            className="hidden md:flex items-center gap-6 text-xs tracking-wide text-[var(--ink-secondary)]"
          >
            <a
              href="#bookshelf"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              গ্রন্থতালিকা
            </a>
            {bookmarks.length > 0 && (
              <button
                onClick={() => setActiveCategory("saved")}
                className="hover:text-[var(--accent-ink)] transition-colors"
              >
                সংরক্ষিত ({toBanglaNumber(bookmarks.length)})
              </button>
            )}
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

      {continueReadingItem && (
        <div className="bg-[var(--bg-subtle)]/70 border-b border-[var(--rule-hairline)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-[var(--accent-ink)] font-medium">
                অসমাপ্ত পাঠ:
              </span>
              <span className="font-displayBn font-medium text-[var(--ink-primary)]">
                {continueReadingItem.book.title}
              </span>
              <span className="text-[var(--ink-muted)] text-xs">
                (পরিচ্ছেদ{" "}
                {toBanglaNumber(continueReadingItem.progress.chapterIndex + 1)}/
                {toBanglaNumber(continueReadingItem.progress.totalChapters)} ·{" "}
                {toBanglaNumber(continueReadingItem.progress.pct)}% পঠিত)
              </span>
            </div>
            <Link
              href={`/book/${continueReadingItem.book.slug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-ink)] hover:underline"
            >
              <span>যেখানে থেমেছিলেন সেখান থেকে পড়ুন</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {featuredBook && activeCategory === "all" ? (
        <section className="bg-[var(--bg-sheet)] border-b border-[var(--rule-hairline)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
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
                  {featuredBook.excerpt ||
                    featuredBook.content.slice(0, 240) + "..."}
                </blockquote>

                <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-muted)] border-t border-[var(--rule-hairline)]">
                  <span className="pt-3">
                    পাঠসময় {toBanglaNumber(featuredBook.reading_time_minutes)}{" "}
                    মিনিট
                  </span>
                  <span className="pt-3">·</span>
                  <time
                    dateTime={featuredBook.published_at}
                    className="pt-3"
                  >
                    প্রকাশকাল {formatBanglaDate(featuredBook.published_at)}
                  </time>
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

                  <button
                    onClick={(e) => toggleBookmark(e, featuredBook.slug)}
                    className="inline-flex items-center gap-1.5 px-4 py-3 border border-[var(--rule-hairline)] hover:border-[var(--ink-primary)] rounded-[2px] text-xs sm:text-sm text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        bookmarks.includes(featuredBook.slug)
                          ? "fill-current text-[var(--accent-ink)]"
                          : ""
                      }`}
                    />
                    <span>
                      {bookmarks.includes(featuredBook.slug)
                        ? "সংরক্ষিত আছে"
                        : "তালিকায় রাখুন"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <main
        id="bookshelf"
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-[var(--rule-hairline)] pb-0 mb-10 sm:mb-14">
          <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = activeCategory === cat.id;
              const label =
                cat.id === "saved" && bookmarks.length > 0
                  ? `${cat.label} (${toBanglaNumber(bookmarks.length)})`
                  : cat.label;
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
                  {label}
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
              aria-label="বই বা গল্প খুঁজুন"
              className="w-full pl-6 pr-2 py-1.5 bg-transparent border-b border-[var(--rule-hairline)] focus:border-[var(--ink-primary)] focus:outline-none text-xs sm:text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]"
            />
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="py-20 text-center border border-[var(--rule-hairline)] bg-[var(--bg-sheet)] px-4">
            <p className="font-displayBn text-xl text-[var(--ink-primary)]">
              {activeCategory === "saved"
                ? "আপনার সংরক্ষিত তালিকায় এখনো কোনো বই নেই।"
                : activeCategory === "series"
                ? "পরবর্তী শুক্রবার রাত ৮:৩০-এ নতুন ৪-পর্বের ধারাবাহিক উপন্যাস শুরু হবে।"
                : "এই বিভাগে এখনো কোনো বই সংযোজিত হয়নি।"}
            </p>
            <p className="font-serifBn text-sm text-[var(--ink-muted)] mt-2">
              {activeCategory === "saved"
                ? "যেকোনো বইয়ের নিচে বা ভেতরে বুকমার্ক চিহ্নে ক্লিক করে প্রিয় বই সংরক্ষণ করে রাখতে পারেন।"
                : "ফেসবুক পাতায় নতুন দীর্ঘ গল্প প্রকাশিত হলেই স্বয়ংক্রিয়ভাবে এখানে গ্রন্থাকারে যুক্ত হবে।"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 sm:gap-x-9 sm:gap-y-14">
            {filteredBooks.map((book) => {
              const saved = bookmarks.includes(book.slug);
              const prog = progressMap[book.slug];

              return (
                <Link
                  key={book.id}
                  href={`/book/${book.slug}`}
                  className="group flex flex-col relative"
                >
                  <div className="pb-4 border-b border-[var(--rule-hairline)] relative">
                    <BookCoverArtwork book={book} size="md" />

                    <button
                      onClick={(e) => toggleBookmark(e, book.slug)}
                      title={saved ? "সংরক্ষণ সরান" : "পরে পড়ার জন্য সংরক্ষণ করুন"}
                      className={`absolute top-2.5 right-4 z-30 p-1.5 bg-[var(--bg-sheet)]/90 border border-[var(--rule-hairline)] transition-opacity ${
                        saved
                          ? "opacity-100 text-[var(--accent-ink)]"
                          : "opacity-0 group-hover:opacity-100 text-[var(--ink-secondary)]"
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${saved ? "fill-current" : ""}`}
                      />
                    </button>

                    {prog && prog.pct > 0 && (
                      <div className="mt-3 h-[2px] w-full bg-[var(--rule-hairline)]">
                        <div
                          className="h-full bg-[var(--accent-ink)]"
                          style={{ width: `${Math.min(100, prog.pct)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--ink-muted)]">
                      <span className="text-[var(--accent-ink)] font-medium truncate">
                        {book.category_label}
                      </span>
                      <span className="shrink-0">
                        {toBanglaNumber(book.reading_time_minutes)} মিনিট
                      </span>
                    </div>

                    <h2 className="font-displayBn text-lg sm:text-[21px] leading-[1.3] text-[var(--ink-primary)] group-hover:text-[var(--accent-ink)] transition-colors line-clamp-2">
                      {book.title}
                    </h2>

                    <p className="font-serifBn text-xs sm:text-[13px] text-[var(--ink-secondary)] line-clamp-2 leading-[1.75]">
                      {book.excerpt || book.content.slice(0, 110) + "..."}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Clean Public Colophon Footer — NO Admin Panel Link Visible to Public! */}
      <footer className="border-t border-[var(--rule-hairline)] bg-[var(--bg-sheet)] py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-[var(--ink-muted)]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <Link
              href="/"
              className="font-masthead text-sm tracking-[0.24em] font-semibold text-[var(--ink-primary)]"
            >
              {settings.site_title}
            </Link>
            <span className="hidden sm:inline">—</span>
            <span className="font-serifBn">{settings.site_tagline}</span>
          </div>

          <nav
            aria-label="বিভাগসমূহ"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            <Link
              href="/category/masterpiece"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              মাস্টারপিস গল্প
            </Link>
            <Link
              href="/category/horror"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              হরর ও অতিপ্রাকৃত
            </Link>
            <Link
              href="/category/love"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              প্রেম ও সংসার
            </Link>
            <Link
              href="/category/thriller"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              রহস্য ও থ্রিলার
            </Link>
            <Link
              href="/category/series"
              className="hover:text-[var(--ink-primary)] transition-colors"
            >
              ধারাবাহিক উপন্যাস
            </Link>
            <a
              href={settings.facebook_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-ink)] hover:underline transition-colors"
            >
              ফেসবুক পাতা ↗
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
