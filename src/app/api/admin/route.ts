import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      password,
      payload,
      coverBase64,
      coverMime,
      oldPassword,
      newPassword,
    } = body;
    const supabase = getSupabaseClient();

    if (action === "verify") {
      const { data, error } = await supabase.rpc("zubro_verify_admin", {
        p_password: password || "",
      });
      if (error || !data) {
        return NextResponse.json(
          { ok: false, error: "পাসওয়ার্ডটি সঠিক নয়!" },
          { status: 401 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "list_books") {
      const [{ data, error }, { data: notesData }, { data: settings }] =
        await Promise.all([
          supabase.rpc("zubro_admin_list_books", {
            p_password: password || "",
          }),
          supabase.rpc("zubro_admin_list_notes", {
            p_password: password || "",
          }),
          supabase
            .from("zubro_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle(),
        ]);

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 401 }
        );
      }
      return NextResponse.json({
        ok: true,
        books: data || [],
        notes: notesData || [],
        settings,
      });
    }

    if (action === "hide_note") {
      const { data, error } = await supabase.rpc("zubro_admin_hide_note", {
        p_password: password || "",
        p_note_id: payload?.id,
      });
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }
      if (payload?.book_slug) revalidatePath(`/book/${payload.book_slug}`);
      return NextResponse.json({ ok: true, hidden: data });
    }

    if (action === "upsert_book") {
      const { data, error } = await supabase.rpc("zubro_admin_upsert_book", {
        p_password: password || "",
        p_book: payload,
        p_cover_base64: coverBase64 || null,
        p_cover_mime: coverMime || "image/jpeg",
      });
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }
      revalidatePath("/");
      if (data?.slug) {
        revalidatePath(`/book/${data.slug}`);
        revalidatePath(`/api/cover/${data.slug}`);
      }
      return NextResponse.json({ ok: true, book: data });
    }

    if (action === "archive_book") {
      const { data, error } = await supabase.rpc("zubro_admin_archive_book", {
        p_password: password || "",
        p_book_id: payload?.id,
      });
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }
      revalidatePath("/");
      return NextResponse.json({ ok: true, archived: data });
    }

    if (action === "update_settings") {
      const { data, error } = await supabase.rpc(
        "zubro_admin_update_settings",
        {
          p_password: password || "",
          p_settings: payload,
        }
      );
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }
      revalidatePath("/");
      return NextResponse.json({ ok: true, settings: data });
    }

    if (action === "change_password") {
      const { data, error } = await supabase.rpc(
        "zubro_admin_change_password",
        {
          p_old_password: oldPassword || "",
          p_new_password: newPassword || "",
        }
      );
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ ok: true, changed: data });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
