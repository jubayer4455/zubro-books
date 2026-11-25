"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  List,
  Moon,
  Share2,
  Sun,
  FileText,
  ExternalLink,
  Check,
} from "lucide-react";
import { ZubroBook } from "@/lib/supabase";
import {
  formatBanglaDate,
  parseStoryIntoChapters,
  toBanglaNumber,
} from "@/lib/chapters";
import BookCoverArtwork from "./BookCoverArtwork";

type ReaderTheme = "night" | "sepia" | "day";

export default function BookReaderView({
  book,
  moreBooks,
}: {
  book: ZubroBook;
  moreBooks: ZubroBook[];
}) {
  const chapters = useMemo(
    () => parseStoryIntoChapters(book.content),
    [book.content]
  );

  const [theme, setTheme] = useState<ReaderTheme>("night");
  const [fontSize, setFontSize] = useState<number>(20);
  const [pagedMode, setPagedMode] = useState<boolean>(chapters.length > 1);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [tocOpen, setTocOpen] = useState<boolean>(false);
  const [coverOpened, setCoverOpened] = useState<boolean>(true);
  const [views, setViews] = useState<number>(book.views_count || 0);
  const [likes, setLikes] = useState<number>(book.likes_count || 0);
  const [liked, setLiked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollPct, setScrollPct] = useState<number>(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("zubro_reader_theme") as ReaderTheme;
    if (savedTheme && ["night", "sepia", "day"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    const savedSize = Number(localStorage.getItem("zubro_reader_size"));
    if (savedSize >= 16 && savedSize <= 30) {
      setFontSize(savedSize);
    }
    const savedCh = Number(localStorage.getItem(`zubro_ch_${book.slug}`));
    if (!Number.isNaN(savedCh) && savedCh >= 0 && savedCh < chapters.length) {
      setCurrentChapter(savedCh);
    }
    if (localStorage.getItem(`zubro_liked_${book.slug}`) === "1") {
      setLiked(true);
    }

    fetch("/api/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: book.slug, type: "view" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.count) setViews(d.count);
      })
      .catch(() => {});
  }, [book.slug, chapters.length]);

  useEffect(() => {
    const onScroll = () => {
      const docH =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docH > 0) {
        setScrollPct(Math.min(100, Math.round((window.scrollY / docH) * 100)));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const changeTheme = (t: ReaderTheme) => {
    setTheme(t);
    localStorage.setItem("zubro_reader_theme", t);
  };

  const adjustFont = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(28, Math.max(16, prev + delta));
      localStorage.setItem("zubro_reader_size", String(next));
      return next;
    });
  };

  const goToChapter = (idx: number) => {
    setCurrentChapter(idx);
    localStorage.setItem(`zubro_ch_${book.slug}`, String(idx));
    setTocOpen(false);
    window.scrollTo({ top: 240, behavior: "smooth" });
  };

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikes((p) => p + 1);
    localStorage.setItem(`zubro_liked_${book.slug}`, "1");
    try {
      const res = await fetch("/api/engage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: book.slug, type: "like" }),
      });
      const data = await res.json();
      if (data?.count) setLikes(data.count);
    } catch {}
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${book.title} — ZUBRO`, url });
        return;
      } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themeClasses = {
    night: {
      pageBg: "bg-[#070912] text-slate-100",
      bookSheet:
        "bg-[#0d1222] border-white/10 text-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.75)]",
      muted: "text-slate-400",
      accent: "text-amber-400",
      barBg: "bg-[#070912]/90 border-white/10 text-slate-200",
    },
    sepia: {
      pageBg: "bg-[#e8dec8] text-[#241b12]",
      bookSheet:
        "bg-[#f6efe0] border-[#d3c3a3] text-[#1f160e] shadow-[0_25px_70px_rgba(62,43,23,0.22)]",
      muted: "text-[#6e5a44]",
      accent: "text-[#9b2226]",
      barBg: "bg-[#efe5d0]/95 border-[#d3c3a3] text-[#241b12]",
    },
    day: {
      pageBg: "bg-slate-100 text-slate-900",
      bookSheet:
        "bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
      muted: "text-slate-500",
      accent: "text-amber-600",
      barBg: "bg-white/95 border-slate-200 text-slate-800",
    },
  }[theme];

  const visibleChapters = pagedMode ? [chapters[currentChapter]] : chapters;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses.pageBg}`}>
      {/* Reading Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-black/20">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-150"
          style={{
            width: `${
              pagedMode && chapters.length > 1
                ? Math.round(((currentChapter + 1) / chapters.length) * 100)
                : scrollPct
            }%`,
          }}
        />
      </div>

      {/* Sticky Reader Control Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${themeClasses.barBg}`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-black/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>বইয়ের তাক</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Selector */}
            <div className="flex items-center rounded-full p-1 bg-black/10 border border-current/10">
              <button
                onClick={() => changeTheme("night")}
                title="রাতের ডার্ক মোড"
                className={`p-1.5 rounded-full transition-all ${
                  theme === "night" ? "bg-amber-500 text-slate-950" : "opacity-65"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => changeTheme("sepia")}
                title="পুরনো বইয়ের পাতা (Sepia)"
                className={`px-2 py-1 rounded-full text-xs font-bold transition-all ${
                  theme === "sepia" ? "bg-[#9b2226] text-white" : "opacity-70"
                }`}
              >
                বই
              </button>
              <button
                onClick={() => changeTheme("day")}
                title="ডে মোড"
                className={`p-1.5 rounded-full transition-all ${
                  theme === "day" ? "bg-slate-900 text-white" : "opacity-65"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center rounded-full px-1.5 py-0.5 bg-black/10 border border-current/10 text-xs font-bold">
              <button
                onClick={() => adjustFont(-2)}
                className="px-2 py-1 hover:opacity-75"
                title="অক্ষর ছোট করুন"
              >
                অ-
              </button>
              <span className="opacity-30">|</span>
              <button
                onClick={() => adjustFont(2)}
                className="px-2 py-1 hover:opacity-75"
                title="অক্ষর বড় করুন"
              >
                অ+
              </button>
            </div>

            {/* Chapters TOC Toggle */}
            {chapters.length > 1 && (
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">সূচিপত্র</span>
                <span>
                  ({toBanglaNumber(currentChapter + 1)}/{toBanglaNumber(chapters.length)})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Chapters Dropdown Drawer */}
        {tocOpen && chapters.length > 1 && (
          <div className="border-t border-current/10 px-4 py-3 max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className="text-xs font-semibold opacity-75">
                অধ্যায় নির্বাচন করুন:
              </span>
              <button
                onClick={() => {
                  setPagedMode(!pagedMode);
                  setTocOpen(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold underline"
              >
                <FileText className="w-3.5 h-3.5" />
                {pagedMode ? "পুরো বই একসাথে পড়ুন" : "পৃষ্ঠা উল্টে অধ্যায়ভিত্তিক পড়ুন"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {chapters.map((ch) => (
                <button
                  key={ch.index}
                  onClick={() => {
                    setPagedMode(true);
                    goToChapter(ch.index);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    pagedMode && currentChapter === ch.index
                      ? "bg-amber-500 text-slate-950"
                      : "bg-black/10 hover:bg-black/20"
                  }`}
                >
                  {ch.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Book Cover Header & Open Book Sheet */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        {/* Book Cover Showcase Header */}
        <div
          className={`rounded-3xl border p-5 sm:p-8 mb-6 sm:mb-10 transition-all ${themeClasses.bookSheet}`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div
              onClick={() => setCoverOpened(!coverOpened)}
              className="w-36 sm:w-44 shrink-0 cursor-pointer"
            >
              <BookCoverArtwork book={book} size="sm" />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{book.category_label}</span>
              </div>

              <h1 className="font-serifBn text-2xl sm:text-4xl font-bold leading-snug">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className={`text-sm sm:text-base font-medium ${themeClasses.muted}`}>
                  {book.subtitle}
                </p>
              )}

              <div
                className={`flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs ${themeClasses.muted}`}
              >
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {toBanglaNumber(book.reading_time_minutes)} মিনিট পাঠ
                </span>
                <span>•</span>
                <span>{toBanglaNumber(chapters.length)}টি অধ্যায়</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {toBanglaNumber(views)} বার পঠিত
                </span>
                <span>•</span>
                <span>{formatBanglaDate(book.published_at)}</span>
              </div>

              {chapters.length > 1 && (
                <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => setPagedMode(!pagedMode)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 transition-colors"
                  >
                    {pagedMode
                      ? "📖 মোড: বইয়ের অধ্যায় উল্টে পড়া (সব একসাথে দেখুন)"
                      : "📜 মোড: একটানা পড়া (বইয়ের পৃষ্ঠা মোডে যান)"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actual Open Book Reading Page */}
        <article
          className={`relative rounded-3xl border px-5 sm:px-12 md:px-16 py-8 sm:py-14 transition-all ${themeClasses.bookSheet}`}
        >
          {/* Decorative Left Book Spine Shadow inside the page */}
          <div className="hidden sm:block absolute inset-y-6 left-3 w-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-transparent pointer-events-none" />

          <div className="space-y-12">
            {visibleChapters.map((ch) => (
              <section key={ch.index} className="space-y-5">
                {chapters.length > 1 && (
                  <div className="text-center pb-4 border-b border-current/10">
                    <span
                      className={`text-xs uppercase tracking-[0.25em] font-bold ${themeClasses.accent}`}
                    >
                      ZUBRO BOOK CHAPTER
                    </span>
                    <h2 className="font-serifBn text-xl sm:text-2xl font-bold mt-1">
                      — {ch.title} —
                    </h2>
                  </div>
                )}

                <div
                  className="font-serifBn space-y-5 leading-[1.95] tracking-[0.01em]"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {ch.paragraphs.map((para, pIdx) => (
                    <p key={pIdx} className="whitespace-pre-line">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Chapter Page-Turn Footer Controls */}
          {pagedMode && chapters.length > 1 && (
            <div className="mt-12 pt-8 border-t border-current/10 flex items-center justify-between gap-3">
              <button
                disabled={currentChapter === 0}
                onClick={() => goToChapter(currentChapter - 1)}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-black/10 hover:bg-black/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>আগের অধ্যায়</span>
              </button>

              <span className={`text-xs sm:text-sm font-semibold ${themeClasses.muted}`}>
                পৃষ্ঠা {toBanglaNumber(currentChapter + 1)} /{" "}
                {toBanglaNumber(chapters.length)}
              </span>

              {currentChapter < chapters.length - 1 ? (
                <button
                  onClick={() => goToChapter(currentChapter + 1)}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <span>পরের অধ্যায়</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <span className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-emerald-500/15 text-emerald-400">
                  ✓ সমাপ্ত
                </span>
              )}
            </div>
          )}

          {/* Appreciation & Share Bar at End of Book */}
          <div className="mt-12 pt-8 border-t border-current/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  liked
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                    : "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                <span>ভালো লেগেছে ({toBanglaNumber(likes)})</span>
              </button>

              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-black/10 hover:bg-black/20 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>লিংক কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>শেয়ার করুন</span>
                  </>
                )}
              </button>
            </div>

            {book.facebook_post_id && (
              <a
                href={`https://www.facebook.com/${book.facebook_post_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:underline ${themeClasses.accent}`}
              >
                <span>ফেসবুকে মূল পোস্ট ও কমেন্ট দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </article>

        {/* More Books Shelf */}
        {moreBooks.length > 0 && (
          <section className="mt-14 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-serifBn text-xl sm:text-2xl font-bold">
                বইঘরের আরও বই
              </h3>
              <Link href="/" className={`text-sm font-semibold ${themeClasses.accent}`}>
                সব দেখুন ➔
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 sm:gap-6">
              {moreBooks.map((b) => (
                <Link key={b.id} href={`/book/${b.slug}`} className="group block">
                  <BookCoverArtwork book={b} size="sm" />
                  <h4 className="font-serifBn font-bold text-sm sm:text-base mt-2.5 group-hover:text-amber-500 transition-colors line-clamp-1">
                    {b.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
