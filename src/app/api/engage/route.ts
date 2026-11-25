import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { slug, type } = await req.json();
    if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = getSupabaseClient();
    if (type === "like") {
      const { data } = await supabase.rpc("zubro_increment_likes", { p_slug: slug });
      return NextResponse.json({ ok: true, count: data ?? 0 });
    }

    const { data } = await supabase.rpc("zubro_increment_views", { p_slug: slug });
    return NextResponse.json({ ok: true, count: data ?? 0 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
