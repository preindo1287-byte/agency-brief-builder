import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { roomCreateSchema } from "@/lib/brief";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`rooms:get:${ip}`);
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
    .order("updated_at", { ascending: false });

  if (error) return fail("ROOM_LIST_FAILED", error.message, 500);
  return ok(data);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "local";
  const limited = rateLimit(`rooms:post:${ip}`);
  if (!limited.allowed) return fail("RATE_LIMITED", "요청이 너무 많습니다.", 429);

  const body = await request.json().catch(() => ({}));
  const parsed = roomCreateSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "룸 생성 입력값이 올바르지 않습니다.", 422, parsed.error.flatten());

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return fail("SUPABASE_CONFIG_MISSING", error instanceof Error ? error.message : "Supabase 설정이 없습니다.", 500);
  }
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({ name: "공개 공유 워크스페이스", created_by: null })
    .select("id")
    .single();
  if (workspaceError || !workspace) return fail("WORKSPACE_CREATE_FAILED", workspaceError?.message || "워크스페이스 생성 실패", 500);

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({ workspace_id: workspace.id, title: parsed.data.title, created_by: null })
    .select("id")
    .single();
  if (roomError || !room) return fail("ROOM_CREATE_FAILED", roomError?.message || "룸 생성 실패", 500);

  const { error: briefError } = await supabase.from("briefs").insert({
    room_id: room.id,
    content: { background: "", objective: "", task: "", target: "", considerations: "", deliverables: "" },
    updated_by: null,
  });
  if (briefError) return fail("BRIEF_CREATE_FAILED", briefError.message, 500);

  return ok({ roomId: room.id }, { status: 201 });
}
