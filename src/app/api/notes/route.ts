import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug") || "";
  if (!slug) {
    return NextResponse.json({ ok: true, notes: [] });
  }
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("zubro_reader_notes")
    .select("id, book_slug, reader_name, note_text, created_at")
    .eq("book_slug", slug)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(40);

  return NextResponse.json({ ok: true, notes: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const { slug, name, note } = await req.json();
    if (!slug || !note || String(note).trim().length < 3) {
      return NextResponse.json(
        { ok: false, error: "অনুগ্রহ করে আপনার অনুভূতি লিখুন।" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc("zubro_add_reader_note", {
      p_slug: slug,
      p_name: name || "নামহীন পাঠক",
      p_note: note,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    revalidatePath(`/book/${slug}`);
    return NextResponse.json({ ok: true, note: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "মন্তব্য সংরক্ষণ করা যায়নি।" },
      { status: 500 }
    );
  }
}
