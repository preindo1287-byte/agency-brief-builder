import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { roomUpdateSchema } from "@/lib/brief";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`room:get:${ip}:${params.roomId}`);
  if (!limited.allowed) return fail("RATE_LIMITED", "요청이 너무 많습니다.", 429);

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail("SUPABASE_CONFIG_MISSING", error instanceof Error ? error.message : "Supabase 설정이 없습니다.", 500);
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("id,title,share_slug,workspace_id,updated_at")
    .eq("id", params.roomId)
    .single();
  if (error) return fail("ROOM_FETCH_FAILED", error.message, 500);
  return ok(data);
}

export async function PATCH(request: NextRequest, { params }: { params: { roomId: string } }) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`room:patch:${ip}:${params.roomId}`);
  if (!limited.allowed) return fail("RATE_LIMITED", "요청이 너무 많습니다.", 429);

  const body = await request.json().catch(() => ({}));
  const parsed = roomUpdateSchema.safeParse({ ...body, roomId: params.roomId });
  if (!parsed.success) return fail("VALIDATION_ERROR", "룸 수정 입력값이 올바르지 않습니다.", 422, parsed.error.flatten());

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail("SUPABASE_CONFIG_MISSING", error instanceof Error ? error.message : "Supabase 설정이 없습니다.", 500);
  }
  const { data, error } = await supabase
    .from("rooms")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.roomId)
    .select("id,title,share_slug,workspace_id,updated_at")
    .single();
  if (error) return fail("ROOM_UPDATE_FAILED", error.message, 500);
  return ok(data);
}
