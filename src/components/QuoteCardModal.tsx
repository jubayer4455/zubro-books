"use client";

import React, { useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";

type CardStyleId = "paper" | "ink" | "oxblood";

const CARD_STYLES: Record<
  CardStyleId,
  {
    label: string;
    bg: string;
    spine: string;
    border: string;
    accent: string;
    ink: string;
    muted: string;
  }
> = {
  paper: {
    label: "হাতে তৈরি কাগজ",
    bg: "#F3ECE0",
    spine: "#7D231B",
    border: "rgba(25, 22, 19, 0.22)",
    accent: "#7D231B",
    ink: "#191613",
    muted: "#5A5044",
  },
  ink: {
    label: "নিশিরাতের কালি",
    bg: "#161412",
    spine: "#B8523B",
    border: "rgba(239, 232, 220, 0.2)",
    accent: "#CF6D4F",
    ink: "#F0E9DD",
    muted: "#A99F91",
  },
  oxblood: {
    label: "খয়েরি কাপড়ের মলাট",
    bg: "#271211",
    spine: "#130807",
    border: "rgba(212, 163, 115, 0.3)",
    accent: "#D4A373",
    ink: "#F4EDE2",
    muted: "#C6B5A2",
  },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split(/\n+/);
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;
    let current = words[0];
    for (let i = 1; i < words.length; i++) {
      const test = current + " " + words[i];
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  }
  return lines.slice(0, 11);
}

export default function QuoteCardModal({
  initialQuote,
  bookTitle,
  categoryLabel,
  onClose,
}: {
  initialQuote: string;
  bookTitle: string;
  categoryLabel: string;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState(() =>
    initialQuote.trim().slice(0, 340)
  );
  const [styleId, setStyleId] = useState<CardStyleId>("paper");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    const draw = async () => {
      if (document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      if (!active || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1080;
      const H = 1350;
      canvas.width = W;
      canvas.height = H;

      const s = CARD_STYLES[styleId];

      // Background paper/cloth
      ctx.fillStyle = s.bg;
      ctx.fillRect(0, 0, W, H);

      // Subtle paper texture dots
      ctx.fillStyle =
        styleId === "paper" ? "rgba(25,22,19,0.025)" : "rgba(255,255,255,0.02)";
      for (let x = 20; x < W; x += 28) {
        for (let y = 20; y < H; y += 28) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      // Left bookbinder cloth spine strip
      ctx.fillStyle = s.spine;
      ctx.fillRect(0, 0, 26, H);

      // Editorial inner hairline frame
      ctx.strokeStyle = s.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(72, 64, W - 136, H - 128);

      // Top rubric
      ctx.fillStyle = s.accent;
      ctx.font = "600 24px 'Noto Serif Bengali', serif";
      ctx.textAlign = "left";
      ctx.fillText(categoryLabel || "নির্বাচিত পংক্তি", 128, 148);

      // Short printer's rule
      ctx.fillStyle = s.accent;
      ctx.fillRect(128, 174, 68, 2);

      // Opening quotation mark
      ctx.fillStyle = s.accent;
      ctx.globalAlpha = 0.35;
      ctx.font = "700 130px Georgia, serif";
      ctx.fillText("“", 118, 320);
      ctx.globalAlpha = 1;

      // Quote body
      const cleanQuote = quote.trim() || "গল্পের প্রিয় লাইন এখানে লিখুন...";
      const fontSize = cleanQuote.length > 210 ? 40 : cleanQuote.length > 120 ? 46 : 52;
      ctx.fillStyle = s.ink;
      ctx.font = `500 ${fontSize}px 'Noto Serif Bengali', serif`;

      const lines = wrapCanvasText(ctx, cleanQuote, W - 260);
      const lineHeight = Math.round(fontSize * 1.62);
      const blockHeight = lines.length * lineHeight;
      let startY = Math.max(370, Math.round((H - blockHeight) / 2) + 10);

      for (const ln of lines) {
        ctx.fillText(ln, 128, startY);
        startY += lineHeight;
      }

      // Bottom book attribution & ZUBRO colophon
      const footerY = H - 190;
      ctx.fillStyle = s.border;
      ctx.fillRect(128, footerY, W - 256, 1.5);

      ctx.fillStyle = s.ink;
      ctx.font = "700 32px 'Noto Serif Bengali', serif";
      ctx.fillText(`— ${bookTitle}`, 128, footerY + 56);

      ctx.fillStyle = s.muted;
      ctx.font = "500 22px Georgia, serif";
      ctx.fillText("ZUBRO  ·  zubrobooks.vercel.app", 128, footerY + 98);
    };

    draw();
    return () => {
      active = false;
    };
  }, [quote, styleId, bookTitle, categoryLabel]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `zubro-quote-${Date.now().toString(36)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleNativeShare = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "zubro-quote.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `${bookTitle} — ZUBRO`,
            text: `“${quote.trim()}” — ${bookTitle}`,
            files: [file],
          });
          return;
        } catch {}
      }
      handleDownload();
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF7F0] text-[#191613] border border-[#D6CCBC] max-w-2xl w-full p-5 sm:p-7 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#D6CCBC]">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-[#8B261D] font-medium">
              উদ্ধৃতি কার্ড স্টুডিও
            </p>
            <h3 className="font-displayBn text-xl mt-0.5">
              গল্পের প্রিয় লাইন ছবি হিসেবে সংরক্ষণ ও শেয়ার করুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-[#D6CCBC] hover:border-[#191613]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-5 items-start">
          <div className="sm:col-span-6 flex justify-center bg-[#EBE3D3] p-3 border border-[#D6CCBC]">
            <canvas
              ref={canvasRef}
              className="w-full max-w-[260px] h-auto shadow-md block"
            />
          </div>

          <div className="sm:col-span-6 space-y-4">
            <div>
              <label className="block text-xs text-[#575047] mb-1.5">
                কার্ডের কাগজ ও মলাটের রঙ
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CARD_STYLES) as CardStyleId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setStyleId(id)}
                    className={`px-2 py-2 text-xs border transition-colors ${
                      styleId === id
                        ? "border-[#8B261D] bg-[#8B261D] text-white font-medium"
                        : "border-[#CFC5B4] bg-white text-[#191613]"
                    }`}
                  >
                    {CARD_STYLES[id].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#575047] mb-1.5">
                নির্বাচিত পংক্তি (প্রয়োজনে সম্পাদনা করতে পারেন)
              </label>
              <textarea
                rows={4}
                maxLength={340}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#CFC5B4] focus:border-[#191613] focus:outline-none text-xs sm:text-sm font-serifBn leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full py-2.5 px-4 bg-[#191613] hover:bg-[#8B261D] text-[#FAF7F0] text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>কোট কার্ড ডাউনলোড করুন (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-4 border border-[#191613] text-[#191613] hover:bg-[#EBE3D3] text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>স্টোরি বা টাইমলাইনে শেয়ার করুন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
