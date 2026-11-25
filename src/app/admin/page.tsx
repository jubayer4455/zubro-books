"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Edit3,
  Eye,
  EyeOff,
  LogOut,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import {
  DEFAULT_SETTINGS,
  ZubroBook,
  ZubroReaderNote,
  ZubroSettings,
} from "@/lib/supabase";
import {
  estimateReadingTimeMinutes,
  formatBanglaDate,
  toBanglaNumber,
} from "@/lib/chapters";
import BookCoverArtwork from "@/components/BookCoverArtwork";

const CATEGORY_OPTIONS = [
  { value: "masterpiece", label: "মাস্টারপিস গল্প" },
  { value: "series", label: "ধারাবাহিক উপন্যাস" },
  { value: "horror", label: "হরর ও অতিপ্রাকৃত" },
  { value: "love", label: "প্রেম ও সংসার" },
  { value: "thriller", label: "রহস্য ও থ্রিলার" },
];

export default function AdminDashboardPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [tab, setTab] = useState<
    "books" | "editor" | "notes" | "settings" | "security"
  >("books");
  const [books, setBooks] = useState<ZubroBook[]>([]);
  const [notes, setNotes] = useState<ZubroReaderNote[]>([]);
  const [settings, setSettings] = useState<ZubroSettings>(DEFAULT_SETTINGS);

  const [editingBook, setEditingBook] = useState<Partial<ZubroBook>>({
    title: "",
    subtitle: "",
    slug: "",
    category: "masterpiece",
    category_label: "মাস্টারপিস গল্প",
    excerpt: "",
    content: "",
    cover_theme: 0,
    is_featured: false,
    is_published: true,
  });
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [coverMime, setCoverMime] = useState<string>("image/jpeg");

  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchDashboard = async (pw: string) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list_books", password: pw }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "পাসওয়ার্ড সঠিক নয়।");
        setAuthenticated(false);
      } else {
        setBooks(data.books || []);
        setNotes(data.notes || []);
        if (data.settings)
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        setAuthenticated(true);
        sessionStorage.setItem("zubro_admin_pw", pw);
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = sessionStorage.getItem("zubro_admin_pw");
    if (saved) {
      setPassword(saved);
      fetchDashboard(saved);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDashboard(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("zubro_admin_pw");
    setAuthenticated(false);
    setPassword("");
  };

  const openNewBookEditor = () => {
    setEditingBook({
      title: "",
      subtitle: "",
      slug: `story-${Date.now().toString(36)}`,
      category: "masterpiece",
      category_label: "মাস্টারপিস গল্প",
      excerpt: "",
      content: "",
      cover_theme: Math.floor(Math.random() * 6),
      is_featured: false,
      is_published: true,
    });
    setCoverBase64(null);
    setCoverPreviewUrl(null);
    setTab("editor");
  };

  const openEditBook = (b: ZubroBook) => {
    setEditingBook({ ...b });
    setCoverBase64(null);
    setCoverPreviewUrl(b.cover_image_url || null);
    setTab("editor");
  };

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const targetW = 900;
        const targetH = 1350;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const scale = Math.max(targetW / img.width, targetH / img.height);
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          ctx.drawImage(
            img,
            (targetW - drawW) / 2,
            (targetH - drawH) / 2,
            drawW,
            drawH
          );
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setCoverPreviewUrl(dataUrl);
          setCoverBase64(dataUrl.replace(/^data:[^;]+;base64,/, ""));
          setCoverMime("image/jpeg");
          showNotice("মলাটের ছবি প্রস্তুত হয়েছে। সংরক্ষণ বোতামে ক্লিক করুন।");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook.title?.trim() || !editingBook.content?.trim()) {
      setErrorMsg("বইয়ের শিরোনাম এবং মূল গল্প অবশ্যই লিখতে হবে।");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const catObj =
        CATEGORY_OPTIONS.find((c) => c.value === editingBook.category) ||
        CATEGORY_OPTIONS[0];

      const payload = {
        ...editingBook,
        category_label: catObj.label,
        excerpt:
          editingBook.excerpt?.trim() ||
          editingBook.content.replace(/\s+/g, " ").trim().slice(0, 190) + "...",
        reading_time_minutes: estimateReadingTimeMinutes(editingBook.content),
      };

      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_book",
          password,
          payload,
          coverBase64,
          coverMime,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || "বই সংরক্ষণ করতে সমস্যা হয়েছে।");
      } else {
        showNotice("বইটি সফলভাবে সংরক্ষিত ও প্রকাশিত হয়েছে।");
        await fetchDashboard(password);
        setTab("books");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickToggle = async (
    book: ZubroBook,
    field: "is_published" | "is_featured"
  ) => {
    setLoading(true);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_book",
          password,
          payload: { ...book, [field]: !book[field] },
        }),
      });
      await fetchDashboard(password);
      showNotice("পরিবর্তন সংরক্ষিত হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveBook = async (book: ZubroBook) => {
    if (
      !confirm(`আপনি কি নিশ্চিতভাবে "${book.title}" বইটি তালিকা থেকে সরাতে চান?`)
    )
      return;
    setLoading(true);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "archive_book",
          password,
          payload: { id: book.id },
        }),
      });
      await fetchDashboard(password);
      showNotice("বইটি আর্কাইভে সরানো হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleHideNote = async (note: ZubroReaderNote) => {
    setLoading(true);
    try {
      await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hide_note",
          password,
          payload: { id: note.id, book_slug: note.book_slug },
        }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      showNotice("পাঠকের মন্তব্যটি সরিয়ে দেওয়া হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          password,
          payload: settings,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showNotice("প্রকাশনা সেটিংস আপডেট হয়েছে।");
      } else {
        setErrorMsg(data.error || "সেটিংস সেভ হয়নি।");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6 || newPass !== confirmPass) {
      setErrorMsg("নতুন পাসওয়ার্ড দুটি মেলেনি অথবা ৬ অক্ষরের কম।");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change_password",
          oldPassword: password,
          newPassword: newPass,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPassword(newPass);
        sessionStorage.setItem("zubro_admin_pw", newPass);
        setNewPass("");
        setConfirmPass("");
        showNotice("পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে।");
      } else {
        setErrorMsg(data.error || "পাসওয়ার্ড পরিবর্তন করা যায়নি।");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] text-[#191613] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#FAF7F0] border border-[#D6CCBC] p-8 sm:p-10 shadow-sm">
          <p className="font-masthead text-xs tracking-[0.28em] text-[#8B261D] uppercase">
            ZUBRO PRESS
          </p>
          <h1 className="font-displayBn text-2xl sm:text-3xl text-[#191613] mt-2">
            সম্পাদনা দপ্তর
          </h1>
          <p className="font-serifBn text-sm text-[#575047] mt-1.5 mb-7 leading-relaxed">
            বইয়ের সংকলন, প্রচ্ছদ ব্যানার, পাঠকের মন্তব্য ও প্রকাশনা নিয়ন্ত্রণ করতে পাসওয়ার্ড দিন।
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-[#8B261D]/10 border border-[#8B261D]/30 text-[#8B261D] text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="অ্যাডমিন পাসওয়ার্ড..."
              className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-sm font-medium transition-colors"
            >
              {loading ? "যাচাই করা হচ্ছে..." : "প্রবেশ করুন"}
            </button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-[#575047] hover:text-[#191613]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল গ্রন্থশালায় ফিরে যান</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalViews = books.reduce((s, b) => s + (b.views_count || 0), 0);
  const totalLikes = books.reduce((s, b) => s + (b.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#F4EFE6] text-[#191613]">
      <header className="sticky top-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-sm border-b border-[#D6CCBC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#575047] hover:text-[#191613]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ওয়েবসাইট দেখুন</span>
            </Link>
            <span className="h-4 w-[1px] bg-[#D6CCBC]" />
            <span className="font-displayBn text-base sm:text-lg">
              জুব্রো সম্পাদনা দপ্তর
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={openNewBookEditor}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-xs sm:text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বই সংযোজন</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 border border-[#D6CCBC] hover:border-[#8B261D] text-[#575047] hover:text-[#8B261D] transition-colors"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#191613] text-[#FAF7F0] text-xs sm:text-sm shadow-lg">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#D6CCBC] bg-[#FAF7F0] divide-y sm:divide-y-0 sm:divide-x divide-[#D6CCBC]">
          <div className="p-4 sm:p-5">
            <p className="text-xs text-[#7D7367]">মোট গ্রন্থ</p>
            <p className="font-displayBn text-2xl mt-1">
              {toBanglaNumber(books.length)}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-[#7D7367]">মোট পাঠসংখ্যা</p>
            <p className="font-displayBn text-2xl mt-1">
              {toBanglaNumber(totalViews)}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-[#7D7367]">পাঠকের পছন্দ</p>
            <p className="font-displayBn text-2xl mt-1">
              {toBanglaNumber(totalLikes)}
            </p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-xs text-[#7D7367]">পাঠকের মন্তব্য</p>
            <p className="font-displayBn text-2xl mt-1">
              {toBanglaNumber(notes.length)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-[#D6CCBC] overflow-x-auto no-scrollbar">
          {[
            {
              id: "books",
              label: `গ্রন্থতালিকা (${toBanglaNumber(books.length)})`,
            },
            {
              id: "editor",
              label: editingBook.id ? "গ্রন্থ সম্পাদনা" : "নতুন গ্রন্থ রচনা",
            },
            {
              id: "notes",
              label: `পাঠকের মন্তব্য (${toBanglaNumber(notes.length)})`,
            },
            { id: "settings", label: "প্রকাশনা সেটিংস" },
            { id: "security", label: "পাসওয়ার্ড পরিবর্তন" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id as typeof tab)}
              className={`pb-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                tab === item.id
                  ? "border-[#8B261D] text-[#191613] font-semibold"
                  : "border-transparent text-[#7D7367] hover:text-[#191613]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#8B261D]/10 border border-[#8B261D]/30 text-[#8B261D] text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: BOOKS LEDGER */}
        {tab === "books" && (
          <div className="border border-[#D6CCBC] bg-[#FAF7F0] divide-y divide-[#D6CCBC]">
            {books.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 shrink-0 hidden sm:block">
                    <BookCoverArtwork book={b} size="sm" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7D7367]">
                      <span className="text-[#8B261D] font-medium">
                        {b.category_label}
                      </span>
                      <span>·</span>
                      <span>
                        {toBanglaNumber(b.reading_time_minutes)} মিনিট পাঠ
                      </span>
                      {b.is_featured && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-[#191613]">
                            প্রচ্ছদ আখ্যান
                          </span>
                        </>
                      )}
                      {!b.is_published && (
                        <>
                          <span>·</span>
                          <span className="text-[#8B261D]">অপ্রকাশিত খসড়া</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-displayBn text-lg sm:text-xl text-[#191613]">
                      {b.title}
                    </h3>
                    <p className="font-serifBn text-xs text-[#575047] line-clamp-1">
                      {b.subtitle || b.excerpt}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleQuickToggle(b, "is_featured")}
                    title="হোমপেজের প্রধান বই হিসেবে নির্বাচন করুন"
                    className={`p-2 border text-xs transition-colors ${
                      b.is_featured
                        ? "bg-[#8B261D] border-[#8B261D] text-white"
                        : "border-[#D6CCBC] text-[#575047] hover:border-[#191613]"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleQuickToggle(b, "is_published")}
                    title={
                      b.is_published ? "ওয়েবসাইট থেকে লুকান" : "প্রকাশ করুন"
                    }
                    className="p-2 border border-[#D6CCBC] text-[#575047] hover:border-[#191613]"
                  >
                    {b.is_published ? (
                      <Eye className="w-4 h-4 text-[#2E5A36]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-[#8B261D]" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditBook(b)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#D6CCBC] hover:border-[#191613] text-xs font-medium"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>সম্পাদনা</span>
                  </button>
                  <button
                    onClick={() => handleArchiveBook(b)}
                    className="p-2 border border-[#D6CCBC] hover:border-[#8B261D] text-[#8B261D]"
                    title="তালিকা থেকে সরান"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: BOOK EDITOR */}
        {tab === "editor" && (
          <form
            onSubmit={handleSaveBook}
            className="p-5 sm:p-8 bg-[#FAF7F0] border border-[#D6CCBC] space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-3 flex flex-col items-center space-y-3">
                <div className="w-40">
                  <BookCoverArtwork
                    book={{
                      id: editingBook.id || "preview",
                      slug: editingBook.slug || "preview",
                      title: editingBook.title || "বইয়ের শিরোনাম",
                      subtitle: editingBook.subtitle || "",
                      category: editingBook.category || "masterpiece",
                      category_label:
                        CATEGORY_OPTIONS.find(
                          (c) => c.value === editingBook.category
                        )?.label || "মাস্টারপিস গল্প",
                      excerpt: editingBook.excerpt || "",
                      content: editingBook.content || "",
                      cover_theme: editingBook.cover_theme ?? 0,
                      cover_image_url: coverPreviewUrl,
                      reading_time_minutes: 8,
                      views_count: 0,
                      likes_count: 0,
                      is_featured: false,
                      is_published: true,
                      facebook_post_id: null,
                      published_at: new Date().toISOString(),
                    }}
                    size="sm"
                  />
                </div>
                <label className="w-full px-3 py-2 border border-[#191613] text-[#191613] hover:bg-[#191613] hover:text-[#FAF7F0] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {coverBase64 ? "নতুন প্রচ্ছদ যুক্ত ✓" : "কাস্টম প্রচ্ছদ আপলোড"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                </label>
                {coverPreviewUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreviewUrl(null);
                      setCoverBase64(null);
                      setEditingBook({ ...editingBook, cover_image_url: null });
                    }}
                    className="text-[11px] text-[#8B261D] underline"
                  >
                    ছবি সরিয়ে কাপড়ের মলাট ব্যবহার করুন
                  </button>
                )}
              </div>

              <div className="lg:col-span-9 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#575047] mb-1.5">
                      বইয়ের শিরোনাম (বাংলায়) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingBook.title || ""}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          title: e.target.value,
                        })
                      }
                      placeholder="যেমন: এমভি রক্তগোলাপের লগবুক"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#575047] mb-1.5">
                      উপশিরোনাম / এক লাইনের আবহ
                    </label>
                    <input
                      type="text"
                      value={editingBook.subtitle || ""}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          subtitle: e.target.value,
                        })
                      }
                      placeholder="যেমন: সদরঘাটের পুরনো আর্কাইভ ও এক নিরুদ্দেশ বন্ধুর গল্প"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#575047] mb-1.5">
                      বিভাগ
                    </label>
                    <select
                      value={editingBook.category || "masterpiece"}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm"
                    >
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[#575047] mb-1.5">
                      কাপড়ের মলাটের রঙ (ছবি না থাকলে ব্যবহৃত হবে)
                    </label>
                    <select
                      value={editingBook.cover_theme ?? 0}
                      onChange={(e) =>
                        setEditingBook({
                          ...editingBook,
                          cover_theme: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm"
                    >
                      <option value={0}>
                        হাতে তৈরি কাগজ ও সিঁদুরে লাল স্পাইন
                      </option>
                      <option value={1}>
                        গাঢ় খয়েরি কাপড় (অতিপ্রাকৃত সংস্করণ)
                      </option>
                      <option value={2}>অরণ্য সবুজ কাপড় (চিরায়ত সংস্করণ)</option>
                      <option value={3}>নীলচে কালো মলাট (রাতের ডায়েরি)</option>
                      <option value={4}>পোড়ামাটি মলাট (জীবনমুখী সংস্করণ)</option>
                      <option value={5}>কালো লেটারপ্রেস সংস্করণ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#575047] mb-1.5">
                    প্রারম্ভিক উদ্ধৃতি / সারসংক্ষেপ (খালি রাখলে গল্পের শুরু থেকে নেওয়া হবে)
                  </label>
                  <textarea
                    rows={2}
                    value={editingBook.excerpt || ""}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        excerpt: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm font-serifBn"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#575047] mb-1.5">
                    সম্পূর্ণ পাণ্ডুলিপি (আলাদা লাইনে ২., ৩., ৪. দিলে স্বয়ংক্রিয়ভাবে পরিচ্ছেদ ভাগ হবে) *
                  </label>
                  <textarea
                    rows={14}
                    required
                    value={editingBook.content || ""}
                    onChange={(e) =>
                      setEditingBook({
                        ...editingBook,
                        content: e.target.value,
                      })
                    }
                    placeholder="এখানে সম্পূর্ণ গল্পটি লিখুন বা পেস্ট করুন..."
                    className="w-full px-4 py-3 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-sm font-serifBn leading-relaxed"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-6 text-sm">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBook.is_published ?? true}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            is_published: e.target.checked,
                          })
                        }
                      />
                      <span>প্রকাশিত রাখুন</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingBook.is_featured ?? false}
                        onChange={(e) =>
                          setEditingBook({
                            ...editingBook,
                            is_featured: e.target.checked,
                          })
                        }
                      />
                      <span>প্রচ্ছদ আখ্যান (Featured)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {loading ? "সংরক্ষিত হচ্ছে..." : "সংরক্ষণ ও প্রকাশ করুন"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: READER NOTES MODERATION */}
        {tab === "notes" && (
          <div className="border border-[#D6CCBC] bg-[#FAF7F0] divide-y divide-[#D6CCBC]">
            {notes.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#7D7367] font-serifBn">
                এখনো কোনো পাঠকের মন্তব্য জমা পড়েনি।
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7D7367]">
                      <span className="font-semibold text-[#191613]">
                        {n.reader_name}
                      </span>
                      <span>·</span>
                      <span className="text-[#8B261D]">
                        {n.book_title || n.book_slug}
                      </span>
                      <span>·</span>
                      <span>{formatBanglaDate(n.created_at)}</span>
                    </div>
                    <p className="font-serifBn text-sm text-[#4E473F] leading-relaxed">
                      {n.note_text}
                    </p>
                  </div>

                  <button
                    onClick={() => handleHideNote(n)}
                    title="মন্তব্যটি সরিয়ে ফেলুন"
                    className="p-2 border border-[#D6CCBC] hover:border-[#8B261D] text-[#8B261D] shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: SITE SETTINGS */}
        {tab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="p-5 sm:p-8 bg-[#FAF7F0] border border-[#D6CCBC] space-y-4 max-w-2xl"
          >
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                প্রকাশনার নাম
              </label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) =>
                  setSettings({ ...settings, site_title: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                মূল স্লোগান / ট্যাগলাইন
              </label>
              <input
                type="text"
                value={settings.site_tagline}
                onChange={(e) =>
                  setSettings({ ...settings, site_tagline: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                ফেসবুক পেজ লিংক
              </label>
              <input
                type="url"
                value={settings.facebook_page_url}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    facebook_page_url: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                বিশেষ ঘোষণা বার (খালি রাখলে বন্ধ থাকবে)
              </label>
              <input
                type="text"
                value={settings.announcement}
                onChange={(e) =>
                  setSettings({ ...settings, announcement: e.target.value })
                }
                placeholder="যেমন: প্রতি শুক্রবার রাত ৮:৩০-এ নতুন ধারাবাহিক উপন্যাস প্রকাশিত হয়।"
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>সেটিংস সংরক্ষণ করুন</span>
            </button>
          </form>
        )}

        {/* TAB 5: SECURITY */}
        {tab === "security" && (
          <form
            onSubmit={handleChangePassword}
            className="p-5 sm:p-8 bg-[#FAF7F0] border border-[#D6CCBC] space-y-4 max-w-md"
          >
            <h3 className="font-displayBn text-xl">
              নতুন পাসওয়ার্ড নির্ধারণ করুন
            </h3>
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                নতুন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-[#575047] mb-1">
                পুনরায় নতুন পাসওয়ার্ড দিন
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#CFC5B4] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-sm font-medium transition-colors"
            >
              পাসওয়ার্ড পরিবর্তন করুন
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
