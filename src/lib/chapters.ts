export interface StoryChapter {
  index: number;
  numberLabel: string;
  title: string;
  paragraphs: string[];
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

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

/**
 * Splits a multi-chapter Bengali story (with markers like ২., ৩., ৪. or ১., ২. on their own lines)
 * into structured book chapters for the interactive Book Reader!
 */
export function parseStoryIntoChapters(rawContent: string): StoryChapter[] {
  const text = String(rawContent || "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const lines = text.split("\n");
  const chapters: { marker: string; bodyLines: string[] }[] = [];
  let currentMarker = "১";
  let currentLines: string[] = [];

  const chapterRegex = /^\s*(?:অধ্যায়\s*)?([১২৩৪৫৬৭৮৯০0-9]{1,2})\s*[.।:-]?\s*$/;

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

  // If no explicit chapter markers existed and story is long, keep as single seamless chapter or split gently
  return chapters.map((ch, idx) => {
    const numBn = toBanglaNumber(idx + 1);
    const paragraphs = ch.bodyLines
      .join("\n")
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return {
      index: idx,
      numberLabel: `পর্ব ${numBn}`,
      title: `অধ্যায় ${numBn}`,
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
