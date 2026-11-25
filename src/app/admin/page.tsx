"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Plus,
  Save,
  Settings,
  Star,
  Trash2,
  Upload,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { DEFAULT_SETTINGS, ZubroBook, ZubroSettings } from "@/lib/supabase";
import { estimateReadingTimeMinutes } from "@/lib/chapters";

const CATEGORY_OPTIONS = [
  { value: "masterpiece", label: "মাস্টারপিস গল্প" },
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

  const [tab, setTab] = useState<"books" | "editor" | "settings" | "security">("books");
  const [books, setBooks] = useState<ZubroBook[]>([]);
  const [settings, setSettings] = useState<ZubroSettings>(DEFAULT_SETTINGS);

  // Editor state
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
  const [coverMime, setCoverMime] = useState<string>("image/jpeg");

  // Password change state
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
        setErrorMsg(data.error || "পাসওয়ার্ড সঠিক নয়!");
        setAuthenticated(false);
      } else {
        setBooks(data.books || []);
        if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        setAuthenticated(true);
        sessionStorage.setItem("zubro_admin_pw", pw);
      }
    } catch {
      setErrorMsg("সার্ভারের সাথে সংযোগ করা যায়নি।");
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
    setTab("editor");
  };

  const openEditBook = (b: ZubroBook) => {
    setEditingBook({ ...b });
    setCoverBase64(null);
    setTab("editor");
  };

  // Compress uploaded banner image cleanly in browser to crisp 900x1350 JPEG
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
          setCoverBase64(dataUrl.replace(/^data:[^;]+;base64,/, ""));
          setCoverMime("image/jpeg");
          showNotice("বুক কভার ব্যানার প্রস্তুত হয়েছে! সেভ বাটনে ক্লিক করুন।");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook.title?.trim() || !editingBook.content?.trim()) {
      setErrorMsg("বইয়ের শিরোনাম এবং মূল গল্প অবশ্যই দিতে হবে!");
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
        setErrorMsg(data.error || "বই সেভ করতে সমস্যা হয়েছে।");
      } else {
        showNotice("বইটি সফলভাবে সেভ ও পাবলিশ হয়েছে!");
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
      showNotice("আপডেট সম্পন্ন হয়েছে!");
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveBook = async (book: ZubroBook) => {
    if (!confirm(`আপনি কি নিশ্চিতভাবে "${book.title}" বইটি মুছে ফেলতে চান?`)) return;
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
      showNotice("বইটি মুছে ফেলা হয়েছে।");
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
        showNotice("সাইট সেটিংস সফলভাবে আপডেট হয়েছে!");
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
      setErrorMsg("নতুন পাসওয়ার্ড দুটি মেলেনি অথবা ৬ অক্ষরের কম!");
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
        showNotice("অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!");
      } else {
        setErrorMsg(data.error || "পাসওয়ার্ড পরিবর্তন করা যায়নি।");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#070912] flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-3xl bg-white/[0.04] border border-white/10 p-7 sm:p-9 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold text-2xl flex items-center justify-center mb-5">
            Z
          </div>
          <h1 className="font-serifBn text-2xl font-bold text-white">
            ZUBRO অ্যাডমিন প্যানেল
          </h1>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            গল্প, বইয়ের ব্যানার ও ওয়েবসাইট নিয়ন্ত্রণ করতে আপনার অ্যাডমিন পাসওয়ার্ড দিন।
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন..."
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/15 focus:border-amber-500 focus:outline-none text-white text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all"
            >
              {loading ? "যাচাই করা হচ্ছে..." : "লগইন করুন"}
            </button>
          </form>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>মূল ওয়েবসাইটে ফিরে যান</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalViews = books.reduce((s, b) => s + (b.views_count || 0), 0);
  const totalLikes = books.reduce((s, b) => s + (b.likes_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#070912] text-slate-100">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-[#070912]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>সাইট দেখুন</span>
            </Link>
            <span className="font-bold text-sm sm:text-base text-amber-400">
              ZUBRO Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openNewBookEditor}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন বই যোগ করুন</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300"
              title="লগআউট"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-2xl">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-slate-400">মোট বই</p>
            <p className="text-2xl font-bold text-white mt-1">{books.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-slate-400">মোট পঠিত (Views)</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{totalViews}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-slate-400">মোট ভালোবাসা (Likes)</p>
            <p className="text-2xl font-bold text-rose-400 mt-1">{totalLikes}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <p className="text-xs text-slate-400">ফেসবুক অটো-সিঙ্ক</p>
            <p className="text-sm font-bold text-emerald-400 mt-2">● সচল (Auto Active)</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTab("books")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${
              tab === "books" ? "bg-amber-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>সব বই ({books.length})</span>
          </button>
          <button
            onClick={() => setTab("editor")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${
              tab === "editor" ? "bg-amber-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{editingBook.id ? "বই এডিট করুন" : "বই লিখুন"}</span>
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${
              tab === "settings" ? "bg-amber-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>সাইট সেটিংস</span>
          </button>
          <button
            onClick={() => setTab("security")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold ${
              tab === "security" ? "bg-amber-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>পাসওয়ার্ড পরিবর্তন</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: BOOKS LIST */}
        {tab === "books" && (
          <div className="space-y-3">
            {books.map((b) => (
              <div
                key={b.id}
                className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300">
                      {b.category_label}
                    </span>
                    {b.is_featured && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300">
                        ★ Featured Hero
                      </span>
                    )}
                    {!b.is_published && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/30 text-slate-300">
                        Hidden (লুকানো)
                      </span>
                    )}
                  </div>
                  <h3 className="font-serifBn font-bold text-lg text-white">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {b.subtitle || b.excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleQuickToggle(b, "is_featured")}
                    title="হোমপেজের শুরুতে পিন করুন"
                    className={`p-2 rounded-xl border text-xs ${
                      b.is_featured
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleQuickToggle(b, "is_published")}
                    title={b.is_published ? "সাইট থেকে লুকান" : "পাবলিশ করুন"}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300"
                  >
                    {b.is_published ? (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditBook(b)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>
                  <button
                    onClick={() => handleArchiveBook(b)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    title="মুছে ফেলুন"
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
            className="p-5 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  বইয়ের শিরোনাম (বাংলায়) *
                </label>
                <input
                  type="text"
                  required
                  value={editingBook.title || ""}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, title: e.target.value })
                  }
                  placeholder="যেমন: নিঝুম রাতের লগবুক"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  সাবটাইটেল / এক লাইনের আবহ
                </label>
                <input
                  type="text"
                  value={editingBook.subtitle || ""}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, subtitle: e.target.value })
                  }
                  placeholder="যেমন: সদরঘাটের পুরনো আর্কাইভ ও এক নিরুদ্দেশ বন্ধুর গল্প"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  ক্যাটাগরি
                </label>
                <select
                  value={editingBook.category || "masterpiece"}
                  onChange={(e) =>
                    setEditingBook({ ...editingBook, category: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  কভার থিম স্টাইল (০–৫)
                </label>
                <select
                  value={editingBook.cover_theme ?? 0}
                  onChange={(e) =>
                    setEditingBook({
                      ...editingBook,
                      cover_theme: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white text-sm"
                >
                  <option value={0}>গোল্ডেন অবসিডিয়ান (Classic Gold)</option>
                  <option value={1}>ক্রিমসন হরর (Dark Crimson)</option>
                  <option value={2}>রয়্যাল এমারেল্ড (Forest Emerald)</option>
                  <option value={3}>মিডনাইট ইন্ডিগো (Midnight Slate)</option>
                  <option value={4}>অ্যান্টিক ব্রোঞ্জ (Warm Bronze)</option>
                  <option value={5}>ভেলভেট পার্পল (Velvet Purple)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  কাস্টম বুক কভার ব্যানার আপলোড (ঐচ্ছিক)
                </label>
                <label className="w-full px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-500/25">
                  <Upload className="w-4 h-4" />
                  <span>{coverBase64 ? "নতুন ব্যানার যুক্ত হয়েছে ✓" : "ছবি বেছে নিন"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                সংক্ষিপ্ত সারসংক্ষেপ (খালি রাখলে অটো তৈরি হবে)
              </label>
              <textarea
                rows={2}
                value={editingBook.excerpt || ""}
                onChange={(e) =>
                  setEditingBook({ ...editingBook, excerpt: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                পুরো গল্প (২., ৩., ৪. দিয়ে আলাদা লাইনে অধ্যায় ভাগ করলে বইয়ে অটো চ্যাপ্টার তৈরি হবে) *
              </label>
              <textarea
                rows={14}
                required
                value={editingBook.content || ""}
                onChange={(e) =>
                  setEditingBook({ ...editingBook, content: e.target.value })
                }
                placeholder="এখানে পুরো গল্পটি লিখুন বা পেস্ট করুন..."
                className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 text-white text-sm font-serifBn leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-5 text-sm">
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
                  <span>পাবলিশ অবস্থায় রাখুন</span>
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
                  <span>হোমপেজের প্রধান বই (Featured)</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "সেভ হচ্ছে..." : "বই সেভ করুন"}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: SITE SETTINGS */}
        {tab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="p-5 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 max-w-2xl"
          >
            <div>
              <label className="block text-xs text-slate-400 mb-1">সাইটের নাম</label>
              <input
                type="text"
                value={settings.site_title}
                onChange={(e) =>
                  setSettings({ ...settings, site_title: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">ট্যাগলাইন</label>
              <input
                type="text"
                value={settings.site_tagline}
                onChange={(e) =>
                  setSettings({ ...settings, site_tagline: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                হিরো ব্যাজ টেক্সট
              </label>
              <input
                type="text"
                value={settings.hero_badge}
                onChange={(e) =>
                  setSettings({ ...settings, hero_badge: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ফেসবুক পেজ লিংক
              </label>
              <input
                type="url"
                value={settings.facebook_page_url}
                onChange={(e) =>
                  setSettings({ ...settings, facebook_page_url: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                টপ নোটিশ / অ্যানাউন্সমেন্ট বার (খালি রাখলে বন্ধ থাকবে)
              </label>
              <input
                type="text"
                value={settings.announcement}
                onChange={(e) =>
                  setSettings({ ...settings, announcement: e.target.value })
                }
                placeholder="যেমন: প্রতিদিন রাত ৮:৩০-এ নতুন ৮ পর্বের গল্প প্রকাশিত হয়!"
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
            >
              <Save className="w-4 h-4" />
              <span>সেটিংস সেভ করুন</span>
            </button>
          </form>
        )}

        {/* TAB 4: SECURITY */}
        {tab === "security" && (
          <form
            onSubmit={handleChangePassword}
            className="p-5 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 max-w-md"
          >
            <h3 className="font-bold text-lg">নতুন অ্যাডমিন পাসওয়ার্ড সেট করুন</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                নতুন পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                পুনরায় নতুন পাসওয়ার্ড দিন
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
            >
              পাসওয়ার্ড আপডেট করুন
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
