import { NextRequest } from "next/server";
import { briefSaveSchema } from "@/lib/brief";
import { fail, ok } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`brief:get:${ip}:${params.roomId}`);
  if (!limited.allowed) return fail("RATE_LIMITED", "요청이 너무 많습니다.", 429);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail("SUPABASE_CONFIG_MISSING", error instanceof Error ? error.message : "Supabase 설정이 없습니다.", 500);
  }

  const { data, error } = await supabase
    .from("briefs")
    .select("id,room_id,content,updated_by,updated_at")
    .eq("room_id", params.roomId)
    .maybeSingle();
  if (error) return fail("BRIEF_FETCH_FAILED", error.message, 500);
  return ok(data);
}

export async function PUT(request: NextRequest, { params }: { params: { roomId: string } }) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`brief:put:${ip}:${params.roomId}`);
  if (!limited.allowed) return fail("RATE_LIMITED", "요청이 너무 많습니다.", 429);

  const body = await request.json().catch(() => ({}));
  const parsed = briefSaveSchema.safeParse({ ...body, roomId: params.roomId });
  if (!parsed.success) return fail("VALIDATION_ERROR", "브리프 입력값이 올바르지 않습니다.", 422, parsed.error.flatten());

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail("SUPABASE_CONFIG_MISSING", error instanceof Error ? error.message : "Supabase 설정이 없습니다.", 500);
  }
  const { data: current } = await supabase
    .from("briefs")
    .select("content")
    .eq("room_id", parsed.data.roomId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("briefs")
    .upsert(
      {
        room_id: parsed.data.roomId,
        content: parsed.data.content,
        updated_by: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "room_id" },
    )
    .select("id,room_id,content,updated_by,updated_at")
    .single();

  if (error) return fail("BRIEF_SAVE_FAILED", error.message, 500);
  if (current?.content) {
    await supabase.from("brief_revisions").insert({
      room_id: parsed.data.roomId,
      content: current.content,
      created_by: null,
    });
  }
  return ok(data);
}
