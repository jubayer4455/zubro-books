"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  List,
  Share2,
} from "lucide-react";
import { ZubroBook } from "@/lib/supabase";
import {
  formatBanglaDate,
  parseStoryIntoChapters,
  toBanglaNumber,
} from "@/lib/chapters";
import BookCoverArtwork from "./BookCoverArtwork";

type ReaderPaper = "paper" | "sepia" | "night";

const PAPER_STYLES: Record<
  ReaderPaper,
  {
    outerBg: string;
    sheetBg: string;
    barBg: string;
    ink: string;
    secondary: string;
    muted: string;
    rule: string;
    accent: string;
    accentHex: string;
  }
> = {
  paper: {
    outerBg: "bg-[#EFEAE0] text-[#1A1714]",
    sheetBg:
      "bg-[#FAF7F0] border-[#D8CFC0] text-[#191613] shadow-[0_12px_40px_rgba(28,22,16,0.07)]",
    barBg: "bg-[#F6F2E9]/95 border-[#D8CFC0] text-[#1A1714]",
    ink: "text-[#191613]",
    secondary: "text-[#4D453C]",
    muted: "text-[#7D7366]",
    rule: "border-[#DDD4C5]",
    accent: "text-[#8B261D]",
    accentHex: "#8B261D",
  },
  sepia: {
    outerBg: "bg-[#E2D6BE] text-[#241B12]",
    sheetBg:
      "bg-[#F2E8D4] border-[#CBBBA0] text-[#221910] shadow-[0_12px_40px_rgba(45,32,16,0.1)]",
    barBg: "bg-[#ECE0C9]/95 border-[#CBBBA0] text-[#241B12]",
    ink: "text-[#221910]",
    secondary: "text-[#574635]",
    muted: "text-[#786550]",
    rule: "border-[#CFC0A6]",
    accent: "text-[#7F231C]",
    accentHex: "#7F231C",
  },
  night: {
    outerBg: "bg-[#12100E] text-[#E9E1D4]",
    sheetBg:
      "bg-[#191613] border-[#2C2722] text-[#E9E1D4] shadow-[0_18px_50px_rgba(0,0,0,0.55)]",
    barBg: "bg-[#141210]/95 border-[#2C2722] text-[#E9E1D4]",
    ink: "text-[#EDE5D8]",
    secondary: "text-[#B5AB9C]",
    muted: "text-[#7E7569]",
    rule: "border-[#2C2722]",
    accent: "text-[#CF6D4F]",
    accentHex: "#CF6D4F",
  },
};

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

  const [paper, setPaper] = useState<ReaderPaper>("paper");
  const [fontSize, setFontSize] = useState<number>(20);
  const [pagedMode, setPagedMode] = useState<boolean>(chapters.length > 1);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [tocOpen, setTocOpen] = useState<boolean>(false);
  const [views, setViews] = useState<number>(book.views_count || 0);
  const [likes, setLikes] = useState<number>(book.likes_count || 0);
  const [liked, setLiked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollPct, setScrollPct] = useState<number>(0);

  useEffect(() => {
    const savedTheme = localStorage.getItem("zubro_reader_theme");
    const globalSurface = localStorage.getItem("zubro_surface");
    if (savedTheme === "paper" || savedTheme === "sepia" || savedTheme === "night") {
      setPaper(savedTheme);
    } else if (globalSurface === "night") {
      setPaper("night");
    }

    const savedSize = Number(localStorage.getItem("zubro_reader_size"));
    if (savedSize >= 16 && savedSize <= 28) {
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

  const goToChapter = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= chapters.length) return;
      setCurrentChapter(idx);
      localStorage.setItem(`zubro_ch_${book.slug}`, String(idx));
      setTocOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [book.slug, chapters.length]
  );

  // Keyboard Left / Right page turning
  useEffect(() => {
    if (!pagedMode || chapters.length <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentChapter < chapters.length - 1) {
        goToChapter(currentChapter + 1);
      } else if (e.key === "ArrowLeft" && currentChapter > 0) {
        goToChapter(currentChapter - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pagedMode, chapters.length, currentChapter, goToChapter]);

  const changePaper = (next: ReaderPaper) => {
    setPaper(next);
    localStorage.setItem("zubro_reader_theme", next);
  };

  const adjustFont = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(28, Math.max(16, prev + delta));
      localStorage.setItem("zubro_reader_size", String(next));
      return next;
    });
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

  const p = PAPER_STYLES[paper];
  const visibleChapters = pagedMode ? [chapters[currentChapter]] : chapters;
  const showFullTitlePage = !pagedMode || currentChapter === 0;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${p.outerBg}`}
      style={{ ["--reader-accent" as string]: p.accentHex }}
    >
      {/* 2px Editorial Ink Progress Hairline */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 bg-black/10">
        <div
          className="h-full transition-all duration-150"
          style={{
            backgroundColor: p.accentHex,
            width: `${
              pagedMode && chapters.length > 1
                ? Math.round(((currentChapter + 1) / chapters.length) * 100)
                : scrollPct
            }%`,
          }}
        />
      </div>

      {/* Quiet Reader Control Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-sm border-b ${p.barBg}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm ${p.secondary} hover:${p.ink} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>গ্রন্থতালিকা</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            {/* Paper Tone Selector */}
            <div className={`flex items-center border ${p.rule} rounded-[2px] overflow-hidden`}>
              <button
                onClick={() => changePaper("paper")}
                className={`px-2.5 py-1 transition-colors ${
                  paper === "paper"
                    ? "bg-[#191613] text-[#FAF7F0] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                কাগজ
              </button>
              <button
                onClick={() => changePaper("sepia")}
                className={`px-2.5 py-1 border-x ${p.rule} transition-colors ${
                  paper === "sepia"
                    ? "bg-[#573D26] text-[#FAF3E3] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                পুরনো পাতা
              </button>
              <button
                onClick={() => changePaper("night")}
                className={`px-2.5 py-1 transition-colors ${
                  paper === "night"
                    ? "bg-[#E9E1D4] text-[#141210] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                রাত
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className={`flex items-center border ${p.rule} rounded-[2px]`}>
              <button
                onClick={() => adjustFont(-2)}
                className={`px-2 py-1 ${p.secondary} hover:${p.ink}`}
                title="অক্ষর ছোট করুন"
              >
                অ−
              </button>
              <span className={`h-3.5 w-[1px] bg-current opacity-15`} />
              <button
                onClick={() => adjustFont(2)}
                className={`px-2 py-1 ${p.secondary} hover:${p.ink}`}
                title="অক্ষর বড় করুন"
              >
                অ+
              </button>
            </div>

            {/* Table of Contents Drawer Button */}
            {chapters.length > 1 && (
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 border ${p.rule} rounded-[2px] ${p.secondary} hover:${p.ink}`}
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

        {/* Minimalist Chapter Drawer */}
        {tocOpen && chapters.length > 1 && (
          <div className={`border-t ${p.rule} px-4 py-4 max-w-4xl mx-auto`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
              <span className={p.muted}>পরিচ্ছেদ নির্বাচন করুন</span>
              <button
                onClick={() => {
                  setPagedMode(!pagedMode);
                  setTocOpen(false);
                }}
                className={`underline underline-offset-4 ${p.accent}`}
              >
                {pagedMode ? "পুরো বই একটানা পড়ুন" : "পৃষ্ঠা উল্টে পরিচ্ছেদভিত্তিক পড়ুন"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {chapters.map((ch) => (
                <button
                  key={ch.index}
                  onClick={() => {
                    setPagedMode(true);
                    goToChapter(ch.index);
                  }}
                  className={`px-3 py-2 text-left text-xs border rounded-[2px] transition-colors ${
                    pagedMode && currentChapter === ch.index
                      ? `border-current font-semibold ${p.accent}`
                      : `${p.rule} ${p.secondary} hover:${p.ink}`
                  }`}
                >
                  {ch.ordinalTitle}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Printed Book Page Sheet */}
      <main className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <article
          className={`relative border rounded-[2px] px-5 sm:px-14 md:px-20 py-9 sm:py-16 transition-colors ${p.sheetBg}`}
        >
          {/* Subtle Left Binding Margin Line on Desktop */}
          <div
            className={`hidden sm:block absolute inset-y-0 left-6 w-[1px] border-l ${p.rule} opacity-55 pointer-events-none`}
          />

          {showFullTitlePage ? (
            /* Novel Frontispiece / Title Page (নামপত্র) */
            <header className={`pb-9 sm:pb-12 mb-10 sm:mb-12 border-b ${p.rule}`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-9">
                <div className="w-32 sm:w-36 shrink-0">
                  <BookCoverArtwork book={book} size="sm" />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3 pt-1">
                  <p className={`text-xs tracking-[0.16em] font-medium ${p.accent}`}>
                    {book.category_label}
                  </p>

                  <h1 className="font-displayBn text-2xl sm:text-4xl leading-[1.24]">
                    {book.title}
                  </h1>

                  {book.subtitle && (
                    <p className={`font-serifBn text-sm sm:text-base leading-relaxed ${p.secondary}`}>
                      {book.subtitle}
                    </p>
                  )}

                  <div
                    className={`pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs ${p.muted}`}
                  >
                    <span>পাঠসময় {toBanglaNumber(book.reading_time_minutes)} মিনিট</span>
                    <span>·</span>
                    <span>{toBanglaNumber(chapters.length)}টি পরিচ্ছেদ</span>
                    <span>·</span>
                    <span>{formatBanglaDate(book.published_at)}</span>
                    {views > 0 && (
                      <>
                        <span>·</span>
                        <span>পঠিত {toBanglaNumber(views)} বার</span>
                      </>
                    )}
                  </div>

                  {chapters.length > 1 && (
                    <div className="pt-2">
                      <button
                        onClick={() => setPagedMode(!pagedMode)}
                        className={`text-xs underline underline-offset-4 ${p.secondary} hover:${p.accent} transition-colors`}
                      >
                        {pagedMode
                          ? "একটানা সব পরিচ্ছেদ একসাথে পড়ুন"
                          : "বইয়ের পাতা উল্টে পরিচ্ছেদভিত্তিক পড়ুন"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>
          ) : (
            /* Running Book Header (চলতি শিরোনাম) on Chapters 2+ */
            <div
              className={`pb-4 mb-9 border-b ${p.rule} flex items-center justify-between text-xs ${p.muted}`}
            >
              <span className="font-displayBn truncate pr-4">{book.title}</span>
              <span className="shrink-0">
                পৃষ্ঠা {toBanglaNumber(currentChapter + 1)} /{" "}
                {toBanglaNumber(chapters.length)}
              </span>
            </div>
          )}

          {/* Story Chapters & Literary Prose */}
          <div className="space-y-14 max-w-[64ch] mx-auto">
            {visibleChapters.map((ch) => (
              <section key={ch.index} className="space-y-7">
                {chapters.length > 1 && (
                  <div className="text-center space-y-2 pb-2">
                    <p className={`font-displayBn text-lg sm:text-xl ${p.ink}`}>
                      {ch.ordinalTitle}
                    </p>
                    <div
                      className="w-10 h-[1px] mx-auto opacity-45"
                      style={{ backgroundColor: p.accentHex }}
                    />
                  </div>
                )}

                <div
                  className="font-serifBn space-y-6 leading-[2.08] tracking-[0.005em]"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {ch.paragraphs.map((para, pIdx) => (
                    <p
                      key={pIdx}
                      className={`whitespace-pre-line ${
                        pIdx === 0 ? "story-lead-paragraph" : ""
                      }`}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* End Mark on Final Chapter or Full Mode */}
          {(!pagedMode || currentChapter === chapters.length - 1) && (
            <div className={`mt-14 pt-6 text-center font-displayBn text-sm tracking-[0.3em] ${p.muted}`}>
              — সমাপ্ত —
            </div>
          )}

          {/* Tactile Page-Turn Navigation */}
          {pagedMode && chapters.length > 1 && (
            <div
              className={`mt-12 pt-7 border-t ${p.rule} flex items-center justify-between gap-3`}
            >
              <button
                disabled={currentChapter === 0}
                onClick={() => goToChapter(currentChapter - 1)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border ${p.rule} rounded-[2px] text-xs sm:text-sm ${p.secondary} hover:${p.ink} disabled:opacity-30 disabled:pointer-events-none transition-colors`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>পূর্ববর্তী পরিচ্ছেদ</span>
              </button>

              <span className={`text-xs ${p.muted}`}>
                {toBanglaNumber(currentChapter + 1)} / {toBanglaNumber(chapters.length)}
              </span>

              {currentChapter < chapters.length - 1 ? (
                <button
                  onClick={() => goToChapter(currentChapter + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] text-xs sm:text-sm font-medium text-[#FAF7F0] transition-opacity hover:opacity-90"
                  style={{ backgroundColor: p.accentHex }}
                >
                  <span>পরবর্তী পরিচ্ছেদ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href="/"
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 border ${p.rule} rounded-[2px] text-xs sm:text-sm ${p.secondary} hover:${p.ink}`}
                >
                  <span>গ্রন্থতালিকায় ফিরুন</span>
                </Link>
              )}
            </div>
          )}

          {/* Quiet Reader Appreciation & Original Post Link */}
          <footer
            className={`mt-12 pt-7 border-t ${p.rule} flex flex-wrap items-center justify-between gap-4`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                className={`inline-flex items-center gap-2 px-4 py-2 border rounded-[2px] text-xs sm:text-sm transition-colors ${
                  liked
                    ? `border-current font-medium ${p.accent}`
                    : `${p.rule} ${p.secondary} hover:${p.ink}`
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
                <span>ভালো লেগেছে · {toBanglaNumber(likes)}</span>
              </button>

              <button
                onClick={handleShare}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 border ${p.rule} rounded-[2px] text-xs sm:text-sm ${p.secondary} hover:${p.ink} transition-colors`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>লিংক কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>শেয়ার</span>
                  </>
                )}
              </button>
            </div>

            {book.facebook_post_id && (
              <a
                href={`https://www.facebook.com/${book.facebook_post_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 text-xs sm:text-sm underline underline-offset-4 ${p.secondary} hover:${p.accent}`}
              >
                <span>ফেসবুকে মূল পোস্ট ও পাঠকদের মন্তব্য</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </footer>
        </article>

        {/* Related Books Shelf */}
        {moreBooks.length > 0 && (
          <section className="mt-14 pt-8 border-t border-current/10 space-y-7">
            <div className="flex items-baseline justify-between">
              <h3 className="font-displayBn text-xl sm:text-2xl">
                গ্রন্থশালার অন্যান্য বই
              </h3>
              <Link
                href="/"
                className={`text-xs sm:text-sm underline underline-offset-4 ${p.secondary}`}
              >
                সব বই দেখুন
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {moreBooks.map((b) => (
                <Link key={b.id} href={`/book/${b.slug}`} className="group block">
                  <BookCoverArtwork book={b} size="sm" />
                  <h4 className="font-displayBn text-base mt-3 group-hover:underline leading-snug line-clamp-2">
                    {b.title}
                  </h4>
                  <p className={`text-xs mt-1 ${p.muted}`}>
                    {toBanglaNumber(b.reading_time_minutes)} মিনিট পাঠ
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
