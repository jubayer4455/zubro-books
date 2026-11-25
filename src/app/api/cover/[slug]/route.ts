import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const supabase = getSupabaseClient();

  const { data: book } = await supabase
    .from("zubro_books")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!book?.id) {
    return new NextResponse("Cover not found", { status: 404 });
  }

  const { data: cover } = await supabase
    .from("zubro_book_covers")
    .select("mime_type, image_base64")
    .eq("book_id", book.id)
    .maybeSingle();

  if (!cover?.image_base64) {
    return new NextResponse("Cover image empty", { status: 404 });
  }

  const cleanBase64 = cover.image_base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(cleanBase64, "base64");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": cover.mime_type || "image/png",
      "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
    },
  });
}
