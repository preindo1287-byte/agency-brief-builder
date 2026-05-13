import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

const roleRank: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

export async function getUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export function canWrite(role?: Role | null) {
  return Boolean(role && roleRank[role] >= roleRank.editor);
}

export function canOwn(role?: Role | null) {
  return role === "owner";
}

export async function getRoomRole(roomId: string, userId: string) {
  const supabase = createClient();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("workspace_id")
    .eq("id", roomId)
    .maybeSingle();

  if (roomError || !room) return null;

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", room.workspace_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError || !member) return null;
  return member.role as Role;
}

export async function requireRoomRole(roomId: string, userId: string, minimum: Role) {
  const role = await getRoomRole(roomId, userId);
  if (!role || roleRank[role] < roleRank[minimum]) {
    throw new Error("권한이 없습니다.");
  }
  return role;
}
