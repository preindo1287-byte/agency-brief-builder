"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoomRole, requireUser } from "@/lib/auth";
import { briefSaveSchema, roomCreateSchema, roomUpdateSchema } from "@/lib/brief";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  ok: boolean;
  message?: string;
  roomId?: string;
};

export async function createRoomAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const supabase = createAdminClient();
  const parsed = roomCreateSchema.safeParse({ title: formData.get("title") || "새 브리프 룸" });
  if (!parsed.success) throw new Error("룸 이름을 확인해 주세요.");

  const { data, error } = await supabase.rpc("create_room_for_user", {
    p_title: parsed.data.title,
    p_user_id: user.id,
  });

  if (error || !data) throw new Error(error?.message || "룸 생성에 실패했습니다.");
  redirect(`/room/${data}`);
}

export async function createPublicRoomAction(formData: FormData): Promise<void> {
  const parsed = roomCreateSchema.safeParse({ title: formData.get("title") || "새 브리프 룸" });
  if (!parsed.success) throw new Error("룸 이름을 확인해 주세요.");

  const supabase = createClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .insert({
      name: "공개 공유 워크스페이스",
      created_by: null,
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) throw new Error(workspaceError?.message || "워크스페이스 생성에 실패했습니다.");

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      workspace_id: workspace.id,
      title: parsed.data.title,
      created_by: null,
    })
    .select("id")
    .single();

  if (roomError || !room) throw new Error(roomError?.message || "룸 생성에 실패했습니다.");

  const { error: briefError } = await supabase.from("briefs").insert({
    room_id: room.id,
    content: {
      background: "",
      objective: "",
      task: "",
      target: "",
      considerations: "",
      deliverables: "",
    },
    updated_by: null,
  });

  if (briefError) throw new Error(briefError.message);
  redirect(`/room/${room.id}`);
}

export async function updateRoomAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = roomUpdateSchema.safeParse({
    roomId: formData.get("roomId"),
    title: formData.get("title"),
  });
  if (!parsed.success) return { ok: false, message: "입력값을 확인해 주세요." };

  await requireRoomRole(parsed.data.roomId, user.id, "editor");
  const supabase = createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.roomId);

  if (error) return { ok: false, message: error.message };
  revalidatePath(`/room/${parsed.data.roomId}`);
  return { ok: true, message: "룸 이름을 저장했습니다.", roomId: parsed.data.roomId };
}

export async function saveBriefAction(input: z.infer<typeof briefSaveSchema>) {
  const user = await requireUser();
  const parsed = briefSaveSchema.parse(input);
  await requireRoomRole(parsed.roomId, user.id, "editor");
  const supabase = createClient();

  const { data: current } = await supabase
    .from("briefs")
    .select("content")
    .eq("room_id", parsed.roomId)
    .maybeSingle();

  const { error } = await supabase.from("briefs").upsert(
    {
      room_id: parsed.roomId,
      content: parsed.content,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id" },
  );

  if (error) throw new Error(error.message);

  if (current?.content) {
    await supabase.from("brief_revisions").insert({
      room_id: parsed.roomId,
      content: current.content,
      created_by: user.id,
    });
  }

  return { ok: true };
}
