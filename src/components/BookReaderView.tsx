"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Heart,
  List,
  Quote,
  Share2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ZubroBook, ZubroReaderNote } from "@/lib/supabase";
import {
  formatBanglaDate,
  parseStoryIntoChapters,
  toBanglaNumber,
} from "@/lib/chapters";
import { SoundMode, soundscape } from "@/lib/soundscape";
import BookCoverArtwork from "./BookCoverArtwork";
import QuoteCardModal from "./QuoteCardModal";

type ReaderPaper = "paper" | "sepia" | "night";

const SOUND_LABELS: Record<SoundMode, string> = {
  off: "নীরব",
  rain: "বৃষ্টি",
  night: "নিঝুম রাত",
  river: "নদী",
};

const SOUND_CYCLE: SoundMode[] = ["off", "rain", "night", "river"];

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
  initialNotes = [],
}: {
  book: ZubroBook;
  moreBooks: ZubroBook[];
  initialNotes?: ZubroReaderNote[];
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
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [scrollPct, setScrollPct] = useState<number>(0);

  // Soundscape state
  const [soundMode, setSoundMode] = useState<SoundMode>("off");

  // Quote Card Studio state
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [quoteModalText, setQuoteModalText] = useState<string | null>(null);

  // Reader Guestbook state
  const [notes, setNotes] = useState<ZubroReaderNote[]>(initialNotes);
  const [readerName, setReaderName] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [noteSubmitting, setNoteSubmitting] = useState<boolean>(false);
  const [noteMessage, setNoteMessage] = useState<string>("");

  const persistProgress = useCallback(
    (chIdx: number, pctVal: number) => {
      try {
        const all = JSON.parse(localStorage.getItem("zubro_progress") || "{}");
        all[book.slug] = {
          chapterIndex: chIdx,
          totalChapters: chapters.length,
          pct: Math.min(100, Math.max(5, pctVal)),
          updatedAt: Date.now(),
        };
        localStorage.setItem("zubro_progress", JSON.stringify(all));
      } catch {}
    },
    [book.slug, chapters.length]
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("zubro_reader_theme");
    const globalSurface = localStorage.getItem("zubro_surface");
    if (
      savedTheme === "paper" ||
      savedTheme === "sepia" ||
      savedTheme === "night"
    ) {
      setPaper(savedTheme);
    } else if (globalSurface === "night") {
      setPaper("night");
    }

    const savedSize = Number(localStorage.getItem("zubro_reader_size"));
    if (savedSize >= 16 && savedSize <= 28) {
      setFontSize(savedSize);
    }

    const savedName = localStorage.getItem("zubro_reader_name");
    if (savedName) setReaderName(savedName);

    try {
      const bms = JSON.parse(localStorage.getItem("zubro_bookmarks") || "[]");
      if (Array.isArray(bms) && bms.includes(book.slug)) {
        setBookmarked(true);
      }
    } catch {}

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

    return () => {
      soundscape.stop();
    };
  }, [book.slug, chapters.length]);

  useEffect(() => {
    const onScroll = () => {
      const docH =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      if (docH > 0) {
        const pct = Math.min(100, Math.round((window.scrollY / docH) * 100));
        setScrollPct(pct);
        if (!pagedMode && pct > 5) {
          persistProgress(0, pct);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pagedMode, persistProgress]);

  // Listen to text selection so readers can turn any highlighted sentence into a Quote Card!
  useEffect(() => {
    const onSelectionChange = () => {
      const sel = window.getSelection()?.toString().trim() || "";
      if (sel.length >= 12 && sel.length <= 360) {
        setSelectedQuote(sel);
      } else {
        setSelectedQuote("");
      }
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", onSelectionChange);
  }, []);

  const goToChapter = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= chapters.length) return;
      setCurrentChapter(idx);
      localStorage.setItem(`zubro_ch_${book.slug}`, String(idx));
      const pct = Math.round(((idx + 1) / chapters.length) * 100);
      persistProgress(idx, pct);
      setTocOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [book.slug, chapters.length, persistProgress]
  );

  useEffect(() => {
    if (!pagedMode || chapters.length <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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

  const cycleSoundscape = () => {
    const idx = SOUND_CYCLE.indexOf(soundMode);
    const next = SOUND_CYCLE[(idx + 1) % SOUND_CYCLE.length];
    setSoundMode(next);
    soundscape.play(next);
  };

  const toggleBookmark = () => {
    try {
      const bms: string[] = JSON.parse(
        localStorage.getItem("zubro_bookmarks") || "[]"
      );
      const next = bookmarked
        ? bms.filter((s) => s !== book.slug)
        : Array.from(new Set([...bms, book.slug]));
      localStorage.setItem("zubro_bookmarks", JSON.stringify(next));
      setBookmarked(!bookmarked);
    } catch {}
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

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || noteText.trim().length < 3) return;
    setNoteSubmitting(true);
    setNoteMessage("");
    try {
      if (readerName.trim()) {
        localStorage.setItem("zubro_reader_name", readerName.trim());
      }
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: book.slug,
          name: readerName.trim() || "নামহীন পাঠক",
          note: noteText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNoteText("");
        setNoteMessage("আপনার অনুভূতি সংরক্ষিত হয়েছে। ধন্যবাদ!");
      } else {
        setNoteMessage(data.error || "সংরক্ষণ করা যায়নি।");
      }
    } catch {
      setNoteMessage("সংযোগ ত্রুটি ঘটেছে।");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const p = PAPER_STYLES[paper];
  const visibleChapters = pagedMode ? [chapters[currentChapter]] : chapters;
  const showFullTitlePage = !pagedMode || currentChapter === 0;
  const defaultQuoteSample =
    chapters[currentChapter]?.paragraphs?.[0]?.slice(0, 220) ||
    book.excerpt ||
    book.title;

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

      {/* Floating Selection -> Quote Card Action Bar */}
      {selectedQuote && !quoteModalText && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => {
              setQuoteModalText(selectedQuote);
              window.getSelection()?.removeAllRanges();
              setSelectedQuote("");
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#191613] text-[#FAF7F0] text-xs sm:text-sm font-medium shadow-xl border border-[#D6CCBC]/30"
          >
            <Quote className="w-3.5 h-3.5 text-[#CF6D4F]" />
            <span>নির্বাচিত লাইন দিয়ে কোট কার্ড তৈরি করুন</span>
          </button>
        </div>
      )}

      {/* Quote Card Modal */}
      {quoteModalText !== null && (
        <QuoteCardModal
          initialQuote={quoteModalText}
          bookTitle={book.title}
          categoryLabel={book.category_label}
          onClose={() => setQuoteModalText(null)}
        />
      )}

      {/* Quiet Reader Control Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-sm border-b ${p.barBg}`}
      >
        <div className="max-w-4xl mx-auto px-3 sm:px-6 h-12 sm:h-14 flex items-center justify-between gap-2">
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 text-xs sm:text-sm shrink-0 ${p.secondary} hover:${p.ink} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">গ্রন্থতালিকা</span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2.5 text-xs overflow-x-auto no-scrollbar">
            {/* Ambient Soundscape Toggle */}
            <button
              onClick={cycleSoundscape}
              title="পড়ার আবহ-শব্দ (বৃষ্টির রাত / নিঝুম রাত / নদী)"
              className={`inline-flex items-center gap-1 px-2.5 py-1 border ${p.rule} rounded-[2px] whitespace-nowrap transition-colors ${
                soundMode !== "off"
                  ? `${p.accent} border-current font-medium`
                  : `${p.muted} hover:${p.ink}`
              }`}
            >
              {soundMode === "off" ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{SOUND_LABELS[soundMode]}</span>
            </button>

            {/* Paper Tone Selector */}
            <div
              className={`flex items-center border ${p.rule} rounded-[2px] overflow-hidden shrink-0`}
            >
              <button
                onClick={() => changePaper("paper")}
                className={`px-2 py-1 transition-colors ${
                  paper === "paper"
                    ? "bg-[#191613] text-[#FAF7F0] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                কাগজ
              </button>
              <button
                onClick={() => changePaper("sepia")}
                className={`px-2 py-1 border-x ${p.rule} transition-colors ${
                  paper === "sepia"
                    ? "bg-[#573D26] text-[#FAF3E3] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                পুরনো
              </button>
              <button
                onClick={() => changePaper("night")}
                className={`px-2 py-1 transition-colors ${
                  paper === "night"
                    ? "bg-[#E9E1D4] text-[#141210] font-medium"
                    : `${p.muted} hover:${p.ink}`
                }`}
              >
                রাত
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div
              className={`flex items-center border ${p.rule} rounded-[2px] shrink-0`}
            >
              <button
                onClick={() => adjustFont(-2)}
                className={`px-2 py-1 ${p.secondary} hover:${p.ink}`}
                title="অক্ষর ছোট করুন"
              >
                অ−
              </button>
              <span className="h-3.5 w-[1px] bg-current opacity-15" />
              <button
                onClick={() => adjustFont(2)}
                className={`px-2 py-1 ${p.secondary} hover:${p.ink}`}
                title="অক্ষর বড় করুন"
              >
                অ+
              </button>
            </div>

            {/* Bookmark Toggle */}
            <button
              onClick={toggleBookmark}
              title={bookmarked ? "সংরক্ষিত তালিকা থেকে সরান" : "বইটি সংরক্ষণ করুন"}
              className={`p-1.5 border ${p.rule} rounded-[2px] shrink-0 ${
                bookmarked ? p.accent : p.muted
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`}
              />
            </button>

            {/* Table of Contents Drawer Button */}
            {chapters.length > 1 && (
              <button
                onClick={() => setTocOpen(!tocOpen)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 border ${p.rule} rounded-[2px] shrink-0 ${p.secondary} hover:${p.ink}`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden md:inline">সূচিপত্র</span>
                <span>
                  ({toBanglaNumber(currentChapter + 1)}/
                  {toBanglaNumber(chapters.length)})
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
                {pagedMode
                  ? "পুরো বই একটানা পড়ুন"
                  : "পৃষ্ঠা উল্টে পরিচ্ছেদভিত্তিক পড়ুন"}
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
          <div
            className={`hidden sm:block absolute inset-y-0 left-6 w-[1px] border-l ${p.rule} opacity-55 pointer-events-none`}
          />

          {showFullTitlePage ? (
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
                    <p
                      className={`font-serifBn text-sm sm:text-base leading-relaxed ${p.secondary}`}
                    >
                      {book.subtitle}
                    </p>
                  )}

                  <div
                    className={`pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs ${p.muted}`}
                  >
                    <span>
                      পাঠসময় {toBanglaNumber(book.reading_time_minutes)} মিনিট
                    </span>
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

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
                    {chapters.length > 1 && (
                      <button
                        onClick={() => setPagedMode(!pagedMode)}
                        className={`underline underline-offset-4 ${p.secondary} hover:${p.accent} transition-colors`}
                      >
                        {pagedMode
                          ? "একটানা সব পরিচ্ছেদ একসাথে পড়ুন"
                          : "বইয়ের পাতা উল্টে পরিচ্ছেদভিত্তিক পড়ুন"}
                      </button>
                    )}

                    <button
                      onClick={() => setQuoteModalText(defaultQuoteSample)}
                      className={`inline-flex items-center gap-1 underline underline-offset-4 ${p.accent}`}
                    >
                      <Quote className="w-3 h-3" />
                      <span>কোট কার্ড তৈরি করুন</span>
                    </button>
                  </div>
                </div>
              </div>
            </header>
          ) : (
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
                    <div key={pIdx} className="group/para relative">
                      <p
                        className={`whitespace-pre-line ${
                          pIdx === 0 ? "story-lead-paragraph" : ""
                        }`}
                      >
                        {para}
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuoteModalText(para.slice(0, 320))}
                        title="এই অনুচ্ছেদ দিয়ে কোট কার্ড তৈরি করুন"
                        className={`hidden sm:inline-flex opacity-0 group-hover/para:opacity-75 hover:!opacity-100 transition-opacity absolute -right-8 top-1 p-1 ${p.muted}`}
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {(!pagedMode || currentChapter === chapters.length - 1) && (
            <div
              className={`mt-14 pt-6 text-center font-displayBn text-sm tracking-[0.3em] ${p.muted}`}
            >
              {book.is_series &&
              (book.current_episode || 1) < (book.total_episodes || 4)
                ? `— পর্ব ${toBanglaNumber(book.current_episode || 1)} সমাপ্ত · পরবর্তী পর্ব আগামী শুক্রবার —`
                : "— সমাপ্ত —"}
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
                {toBanglaNumber(currentChapter + 1)} /{" "}
                {toBanglaNumber(chapters.length)}
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

          {/* Quiet Reader Appreciation & Actions */}
          <footer
            className={`mt-12 pt-7 border-t ${p.rule} flex flex-wrap items-center justify-between gap-4`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
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
                onClick={() => setQuoteModalText(defaultQuoteSample)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 border ${p.rule} rounded-[2px] text-xs sm:text-sm ${p.secondary} hover:${p.ink} transition-colors`}
              >
                <Quote className="w-3.5 h-3.5" />
                <span>কোট কার্ড</span>
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

        {/* Reader Guestbook / পাঠকের অনুভূতি */}
        <section
          className={`mt-10 border rounded-[2px] px-5 sm:px-12 py-8 sm:py-10 ${p.sheetBg}`}
        >
          <div className={`pb-4 mb-6 border-b ${p.rule}`}>
            <p className={`text-xs tracking-[0.16em] font-medium ${p.accent}`}>
              পাঠক-প্রতিক্রিয়া
            </p>
            <h3 className="font-displayBn text-xl sm:text-2xl mt-1">
              গল্পটি পড়ে আপনার অনুভূতি লিখে রাখুন (
              {toBanglaNumber(notes.length)})
            </h3>
          </div>

          <form onSubmit={handleSubmitNote} className="space-y-3 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                maxLength={50}
                value={readerName}
                onChange={(e) => setReaderName(e.target.value)}
                placeholder="আপনার নাম (ঐচ্ছিক)"
                className={`px-3.5 py-2 bg-transparent border ${p.rule} focus:outline-none text-xs sm:text-sm rounded-[2px]`}
              />
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="গল্পের কোন অংশটি ছুঁয়ে গেছে বা কেমন লেগেছে লিখুন..."
                  className={`w-full px-3.5 py-2 bg-transparent border ${p.rule} focus:outline-none text-xs sm:text-sm font-serifBn rounded-[2px]`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className={`text-xs ${p.accent}`}>{noteMessage}</span>
              <button
                type="submit"
                disabled={noteSubmitting}
                className="px-5 py-2 rounded-[2px] text-xs sm:text-sm font-medium text-[#FAF7F0] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: p.accentHex }}
              >
                {noteSubmitting ? "প্রকাশিত হচ্ছে..." : "অনুভূতি যুক্ত করুন"}
              </button>
            </div>
          </form>

          {notes.length === 0 ? (
            <p className={`font-serifBn text-xs sm:text-sm ${p.muted}`}>
              এখনো কোনো পাঠক-মন্তব্য যুক্ত হয়নি। প্রথম অনুভূতিটি আপনিই লিখে রাখুন।
            </p>
          ) : (
            <div className={`divide-y ${p.rule}`}>
              {notes.map((n) => (
                <div key={n.id} className="py-4 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold">{n.reader_name}</span>
                    <span className={p.muted}>
                      {formatBanglaDate(n.created_at)}
                    </span>
                  </div>
                  <p
                    className={`font-serifBn text-sm leading-relaxed ${p.secondary}`}
                  >
                    {n.note_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

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
                <Link
                  key={b.id}
                  href={`/book/${b.slug}`}
                  className="group block"
                >
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
