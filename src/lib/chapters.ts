export interface StoryChapter {
  index: number;
  numberLabel: string;
  ordinalTitle: string;
  title: string;
  paragraphs: string[];
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const BN_ORDINALS = [
  "প্রথম পরিচ্ছেদ",
  "দ্বিতীয় পরিচ্ছেদ",
  "তৃতীয় পরিচ্ছেদ",
  "চতুর্থ পরিচ্ছেদ",
  "পঞ্চম পরিচ্ছেদ",
  "ষষ্ঠ পরিচ্ছেদ",
  "সপ্তম পরিচ্ছেদ",
  "অষ্টম পরিচ্ছেদ",
  "নবম পরিচ্ছেদ",
  "দশম পরিচ্ছেদ",
  "একাদশ পরিচ্ছেদ",
  "দ্বাদশ পরিচ্ছেদ",
];

export function toBanglaNumber(num: number | string): string {
  return String(num).replace(/\d/g, (d) => BN_DIGITS[Number(d)] || d);
}

export function formatBanglaDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("bn-BD", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function parseStoryIntoChapters(rawContent: string): StoryChapter[] {
  const text = String(rawContent || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n");
  const chapters: { marker: string; bodyLines: string[] }[] = [];
  let currentMarker = "১";
  let currentLines: string[] = [];

  const chapterRegex = /^\s*(?:অধ্যায়\s*|পরিচ্ছেদ\s*|পর্ব\s*)?([১২৩৪৫৬৭৮৯০0-9]{1,2})\s*[.।:-]?\s*$/;

  for (const line of lines) {
    const match = line.match(chapterRegex);
    if (match) {
      if (currentLines.some((l) => l.trim().length > 0)) {
        chapters.push({ marker: currentMarker, bodyLines: currentLines });
        currentLines = [];
      }
      currentMarker = toBanglaNumber(match[1]);
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.some((l) => l.trim().length > 0)) {
    chapters.push({ marker: currentMarker, bodyLines: currentLines });
  }

  return chapters.map((ch, idx) => {
    const numBn = toBanglaNumber(idx + 1);
    const ordinal = BN_ORDINALS[idx] || `পরিচ্ছেদ ${numBn}`;
    const paragraphs = ch.bodyLines
      .join("\n")
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return {
      index: idx,
      numberLabel: numBn,
      ordinalTitle: ordinal,
      title: ordinal,
      paragraphs:
        paragraphs.length > 0
          ? paragraphs
          : ch.bodyLines.map((l) => l.trim()).filter(Boolean),
    };
  });
}

export function estimateReadingTimeMinutes(text: string): number {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 170));
}
