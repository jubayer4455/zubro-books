"use client";

import React, { useState } from "react";
import { ZubroBook } from "@/lib/supabase";

const CLOTH_EDITIONS = [
  {
    coverBg: "#EFE8DA",
    spineBg: "#7D231B",
    frameBorder: "rgba(43, 34, 27, 0.28)",
    innerRule: "rgba(125, 35, 27, 0.45)",
    titleColor: "#1A1613",
    subColor: "#544A3E",
    rubricColor: "#7D231B",
    colophonColor: "#4A4036",
  },
  {
    coverBg: "#2B1312",
    spineBg: "#170908",
    frameBorder: "rgba(216, 195, 165, 0.32)",
    innerRule: "rgba(201, 154, 107, 0.48)",
    titleColor: "#F3ECE1",
    subColor: "#C8B9A6",
    rubricColor: "#D4A373",
    colophonColor: "#B8A894",
  },
  {
    coverBg: "#1A2821",
    spineBg: "#0F1814",
    frameBorder: "rgba(218, 208, 188, 0.3)",
    innerRule: "rgba(186, 168, 132, 0.42)",
    titleColor: "#F1ECE1",
    subColor: "#BFC7BE",
    rubricColor: "#D2B48C",
    colophonColor: "#AAB3A9",
  },
  {
    coverBg: "#1B2430",
    spineBg: "#10161F",
    frameBorder: "rgba(220, 214, 201, 0.28)",
    innerRule: "rgba(184, 173, 152, 0.4)",
    titleColor: "#F2EFE9",
    subColor: "#BCC3CC",
    rubricColor: "#D6C3A5",
    colophonColor: "#A5AEBA",
  },
  {
    coverBg: "#5C2C20",
    spineBg: "#381911",
    frameBorder: "rgba(242, 232, 217, 0.32)",
    innerRule: "rgba(230, 206, 176, 0.45)",
    titleColor: "#FAF4EB",
    subColor: "#DFCBB8",
    rubricColor: "#EED7B5",
    colophonColor: "#D4BEA9",
  },
  {
    coverBg: "#1E1C1A",
    spineBg: "#11100E",
    frameBorder: "rgba(214, 204, 188, 0.28)",
    innerRule: "rgba(176, 82, 61, 0.55)",
    titleColor: "#F0EAE0",
    subColor: "#B8AFA2",
    rubricColor: "#C96D53",
    colophonColor: "#9E9589",
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
  const themeIdx =
    isHorror && book.cover_theme === 0
      ? 1
      : Math.abs(book.cover_theme || 0) % CLOTH_EDITIONS.length;
  const ed = CLOTH_EDITIONS[themeIdx];

  const hasUploadedBanner = Boolean(book.cover_image_url) && !imgFailed;
  const coverSrc = book.cover_image_url
    ? `${book.cover_image_url}${book.cover_image_url.includes("?") ? "&" : "?"}ed=2`
    : null;

  return (
    <div className="physical-book w-full pr-2">
      <div
        className="physical-book-cover cloth-weave relative aspect-[2/3] w-full overflow-hidden select-none"
        style={{ backgroundColor: ed.coverBg }}
      >
        {!hasUploadedBanner && (
          <div
            className="absolute inset-y-0 left-0 w-3 sm:w-3.5 z-10"
            style={{ backgroundColor: ed.spineBg }}
          />
        )}

        <div className="book-hinge-crease absolute inset-y-0 left-0 w-4 sm:w-5 z-20 pointer-events-none" />

        {hasUploadedBanner ? (
          <div className="relative w-full h-full">
            <img
              src={coverSrc!}
              alt={`${book.title} — ${book.category_label || "বাংলা গল্প"} | ZUBRO বইয়ের প্রচ্ছদ`}
              loading={size === "lg" ? "eager" : "lazy"}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover block"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(0,0,0,0.18), inset 0 0 28px rgba(0,0,0,0.16)",
              }}
            />
          </div>
        ) : (
          <div className="relative z-10 w-full h-full p-3.5 sm:p-5 pl-5 sm:pl-7 flex flex-col justify-between">
            <div
              className="w-full h-full p-3.5 sm:p-5 flex flex-col justify-between relative"
              style={{ border: `1px solid ${ed.frameBorder}` }}
            >
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] tracking-[0.14em] font-medium block"
                  style={{ color: ed.rubricColor }}
                >
                  {book.category_label}
                </span>
                <div
                  className="w-8 h-[1px] mx-auto mt-2"
                  style={{ backgroundColor: ed.innerRule }}
                />
              </div>

              <div className="my-auto py-2 text-center px-1">
                <h3
                  style={{ color: ed.titleColor }}
                  className={`font-displayBn leading-[1.3] ${
                    size === "lg"
                      ? "text-2xl sm:text-3xl"
                      : size === "sm"
                      ? "text-base"
                      : "text-lg sm:text-[21px]"
                  }`}
                >
                  {book.title}
                </h3>
                {book.subtitle && size !== "sm" && (
                  <p
                    style={{ color: ed.subColor }}
                    className="text-[11px] sm:text-xs mt-2.5 line-clamp-2 leading-relaxed font-serifBn"
                  >
                    {book.subtitle}
                  </p>
                )}
              </div>

              <div
                className="pt-2.5 text-center"
                style={{ borderTop: `1px solid ${ed.frameBorder}` }}
              >
                <span
                  style={{ color: ed.colophonColor }}
                  className="font-serifBn text-[10px] sm:text-[11px] tracking-[0.22em]"
                >
                  জুব্রো সংস্করণ
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
