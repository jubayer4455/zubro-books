"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Eye,
  Heart,
  Search,
  Sparkles,
  Skull,
  Flame,
  ExternalLink,
} from "lucide-react";
import { ZubroBook, ZubroSettings } from "@/lib/supabase";
import { formatBanglaDate, toBanglaNumber } from "@/lib/chapters";
import BookCoverArtwork from "./BookCoverArtwork";

const CATEGORIES = [
  { id: "all", label: "সব বই", icon: BookOpen },
  { id: "masterpiece", label: "মাস্টারপিস গল্প", icon: Sparkles },
  { id: "horror", label: "হরর ও অতিপ্রাকৃত", icon: Skull },
  { id: "love", label: "প্রেম ও সংসার", icon: Heart },
  { id: "thriller", label: "রহস্য ও থ্রিলার", icon: Flame },
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
    <div className="min-h-screen bg-[#070912] text-slate-100 flex flex-col">
      {/* Optional Announcement Banner */}
      {settings.announcement && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/20 border-b border-amber-500/30 text-amber-200 text-xs sm:text-sm py-2.5 px-4 text-center font-medium">
          ✦ {settings.announcement}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#070912]/85 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
              Z
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-[0.22em] text-white group-hover:text-amber-400 transition-colors">
                {settings.site_title}
              </span>
              <p className="text-[11px] sm:text-xs text-slate-400 -mt-0.5">
                {settings.site_tagline}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <a
              href={settings.facebook_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all"
            >
              <span>ফেসবুক পেজ</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Featured Book Banner */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/15 blur-[130px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          {featuredBook ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-7 order-2 lg:order-1 space-y-5 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>{settings.hero_badge} • নির্বাচিত বই</span>
                </div>

                <h1 className="font-serifBn text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {featuredBook.title}
                </h1>

                {featuredBook.subtitle && (
                  <p className="text-base sm:text-xl text-amber-300/90 font-medium">
                    {featuredBook.subtitle}
                  </p>
                )}

                <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-2xl mx-auto lg:mx-0 line-clamp-3 font-serifBn">
                  {featuredBook.excerpt || featuredBook.content.slice(0, 240) + "..."}
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-slate-400 pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {toBanglaNumber(featuredBook.reading_time_minutes)} মিনিট পাঠ
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-400" />
                    {toBanglaNumber(featuredBook.views_count)} বার পঠিত
                  </span>
                  <span>•</span>
                  <span>{formatBanglaDate(featuredBook.published_at)}</span>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3.5">
                  <Link
                    href={`/book/${featuredBook.slug}`}
                    className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm sm:text-base shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>বইটি খুলে পড়ুন</span>
                  </Link>
                  <a
                    href="#bookshelf"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 font-medium text-sm sm:text-base transition-all"
                  >
                    সব বই দেখুন ({toBanglaNumber(books.length)})
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
                <Link
                  href={`/book/${featuredBook.slug}`}
                  className="w-56 sm:w-72 lg:w-80 block"
                >
                  <BookCoverArtwork book={featuredBook} size="lg" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-2xl mx-auto py-12 space-y-4">
              <span className="px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold">
                {settings.hero_badge}
              </span>
              <h1 className="font-serifBn text-3xl sm:text-5xl font-bold text-white">
                {settings.site_title} — {settings.site_tagline}
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                {settings.hero_description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Main Bookshelf Section */}
      <main
        id="bookshelf"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
      >
        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                      : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="বই বা গল্পের নাম খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 focus:border-amber-500/60 focus:outline-none text-sm text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-white/[0.02] border border-white/10">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-300">
              এই ক্যাটাগরিতে এখনো কোনো বই পাওয়া যায়নি।
            </p>
            <p className="text-sm text-slate-500 mt-1">
              ফেসবুক পেজে নতুন মাস্টারপিস বা হরর গল্প পোস্ট হলেই এখানে অটোমেটিক বই আকারে যুক্ত হয়ে যাবে!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/book/${book.slug}`}
                className="group flex flex-col"
              >
                <BookCoverArtwork book={book} size="md" />
                <div className="mt-3.5 space-y-1 px-1">
                  <h2 className="font-serifBn font-bold text-base sm:text-lg text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {book.title}
                  </h2>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {book.excerpt || book.content.slice(0, 100) + "..."}
                  </p>
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500/80" />
                      {toBanglaNumber(book.reading_time_minutes)} মিনিট
                    </span>
                    <span className="inline-flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {toBanglaNumber(book.views_count)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400/80" />
                        {toBanglaNumber(book.likes_count)}
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#05070e] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-widest text-slate-300">
              {settings.site_title}
            </span>
            <span>— {settings.site_tagline}</span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href={settings.facebook_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-400 transition-colors"
            >
              ফেসবুক পেজ
            </a>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">
              অ্যাডমিন প্যানেল
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
