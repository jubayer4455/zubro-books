import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zlotgghqdfrbxeuinjjy.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_EQXlW6lnynZXo4_sgpxAsA_CHaxm2tU";

export function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

export interface ZubroBook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: "masterpiece" | "horror" | "love" | "thriller" | string;
  category_label: string;
  excerpt: string;
  content: string;
  cover_theme: number;
  cover_image_url: string | null;
  reading_time_minutes: number;
  views_count: number;
  likes_count: number;
  is_featured: boolean;
  is_published: boolean;
  facebook_post_id: string | null;
  published_at: string;
}

export interface ZubroSettings {
  site_title: string;
  site_tagline: string;
  hero_badge: string;
  hero_description: string;
  facebook_page_url: string;
  announcement: string;
}

export const DEFAULT_SETTINGS: ZubroSettings = {
  site_title: "ZUBRO",
  site_tagline: "না বলা কথা ও জীবনের গল্প",
  hero_badge: "ডিজিটাল গল্পের বইঘর",
  hero_description:
    "রাতের নিস্তব্ধতায় হারিয়ে যাওয়ার মতো গভীর মাস্টারপিস ও গা ছমছমে অতিপ্রাকৃত হরর গল্পের সংকলন। প্রতিটি মলাটে লুকিয়ে আছে একেকটি না বলা পৃথিবী।",
  facebook_page_url: "https://www.facebook.com/403104726229128",
  announcement: "",
};
