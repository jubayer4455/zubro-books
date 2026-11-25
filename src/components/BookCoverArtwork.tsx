"use client";

import React, { useState } from "react";
import { ZubroBook } from "@/lib/supabase";

const COVER_THEMES = [
  {
    bg: "linear-gradient(150deg, #1a120b 0%, #0d0907 55%, #050404 100%)",
    border: "rgba(212, 175, 55, 0.45)",
    accent: "#eab308",
    badgeBg: "rgba(234, 179, 8, 0.16)",
    text: "#fefce8",
    ornament: "✦",
  },
  {
    bg: "linear-gradient(155deg, #2b0912 0%, #14050a 60%, #070204 100%)",
    border: "rgba(244, 63, 94, 0.4)",
    accent: "#fb7185",
    badgeBg: "rgba(244, 63, 94, 0.16)",
    text: "#fff1f2",
    ornament: "❖",
  },
  {
    bg: "linear-gradient(150deg, #09221c 0%, #04120f 60%, #020806 100%)",
    border: "rgba(52, 211, 153, 0.4)",
    accent: "#34d399",
    badgeBg: "rgba(52, 211, 153, 0.14)",
    text: "#ecfdf5",
    ornament: "✧",
  },
  {
    bg: "linear-gradient(150deg, #0f172a 0%, #090d1a 60%, #03050a 100%)",
    border: "rgba(129, 140, 248, 0.42)",
    accent: "#a5b4fc",
    badgeBg: "rgba(99, 102, 241, 0.18)",
    text: "#eef2ff",
    ornament: "◈",
  },
  {
    bg: "linear-gradient(150deg, #291811 0%, #170d09 60%, #0a0504 100%)",
    border: "rgba(251, 146, 60, 0.4)",
    accent: "#fb923c",
    badgeBg: "rgba(251, 146, 60, 0.15)",
    text: "#fff7ed",
    ornament: "❂",
  },
  {
    bg: "linear-gradient(150deg, #1f1135 0%, #10081c 60%, #06030a 100%)",
    border: "rgba(192, 132, 252, 0.42)",
    accent: "#c084fc",
    badgeBg: "rgba(192, 132, 252, 0.16)",
    text: "#faf5ff",
    ornament: "✦",
  },
];

export default function BookCoverArtwork({
  book,
  size = "md",
}: {
  book: ZubroBook;
  size?: "sm" | "md" | "lg";
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const isHorror = book.category === "horror";
  const themeIdx = isHorror && book.cover_theme === 0 ? 1 : Math.abs(book.cover_theme || 0) % COVER_THEMES.length;
  const theme = COVER_THEMES[themeIdx];

  const hasUploadedBanner = Boolean(book.cover_image_url) && !imgFailed;

  return (
    <div className="book-card-3d w-full">
      <div
        className="book-cover-inner relative aspect-[2/3] w-full rounded-r-2xl rounded-l-[5px] overflow-hidden select-none"
        style={{ background: theme.bg }}
      >
        {/* Hardcover Spine Crease */}
        <div className="book-spine-groove absolute inset-y-0 left-0 w-5 z-20 pointer-events-none" />

        {hasUploadedBanner ? (
          <>
            <img
              src={book.cover_image_url!}
              alt={book.title}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover block"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />
            <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md bg-black/55 border border-white/15 text-amber-300">
              {book.category_label}
            </div>
            <div className="absolute inset-x-4 bottom-4 z-10 pl-2">
              <h3
                className={`font-serifBn font-bold text-white leading-snug drop-shadow-lg ${
                  size === "lg" ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
                }`}
              >
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="text-xs sm:text-sm text-slate-200/85 mt-1 line-clamp-1">
                  {book.subtitle}
                </p>
              )}
              <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] tracking-widest text-amber-300/90 font-semibold">
                <span>ZUBRO EDITION</span>
                <span>বইটি খুলুন ➔</span>
              </div>
            </div>
          </>
        ) : (
          /* Luxury Embossed Hardcover Literary Design Fallback */
          <div className="relative z-10 w-full h-full p-4 sm:p-5 pl-6 sm:pl-7 flex flex-col justify-between">
            <div
              className="w-full h-full rounded-xl p-4 sm:p-5 flex flex-col justify-between relative"
              style={{ border: `1.5px solid ${theme.border}` }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
                  style={{
                    background: theme.badgeBg,
                    color: theme.accent,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {book.category_label}
                </span>
                <span style={{ color: theme.accent }} className="text-base opacity-80">
                  {theme.ornament}
                </span>
              </div>

              <div className="my-auto py-3 text-center">
                <div
                  className="w-10 h-[2px] mx-auto mb-3 opacity-75"
                  style={{ background: theme.accent }}
                />
                <h3
                  style={{ color: theme.text }}
                  className={`font-serifBn font-bold leading-snug ${
                    size === "lg"
                      ? "text-2xl sm:text-3xl"
                      : size === "sm"
                      ? "text-base"
                      : "text-lg sm:text-xl"
                  }`}
                >
                  {book.title}
                </h3>
                {book.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-300/80 mt-2 line-clamp-2 font-sansBn">
                    {book.subtitle}
                  </p>
                )}
                <div
                  className="w-10 h-[2px] mx-auto mt-3 opacity-75"
                  style={{ background: theme.accent }}
                />
              </div>

              <div
                className="pt-2.5 flex items-center justify-between text-[11px] tracking-widest uppercase font-semibold"
                style={{
                  borderTop: `1px solid ${theme.border}`,
                  color: theme.accent,
                }}
              >
                <span>ZUBRO</span>
                <span className="text-[10px] opacity-85">খুলে পড়ুন</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
