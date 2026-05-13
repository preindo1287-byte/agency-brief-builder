import { redirect } from "next/navigation";
import BriefEditor from "@/components/BriefEditor";
import { initialBrief } from "@/lib/brief";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BriefSections } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { room?: string };
}) {
  if (searchParams.room && searchParams.room !== params.roomId) redirect(`/room/${searchParams.room}`);

  const supabase = createAdminClient();
  const [{ data: room }, { data: brief }, { data: revisions }] = await Promise.all([
    supabase.from("rooms").select("id,title,updated_at").eq("id", params.roomId).single(),
    supabase.from("briefs").select("content,updated_at").eq("room_id", params.roomId).maybeSingle(),
    supabase
      .from("brief_revisions")
      .select("id,content,created_at")
      .eq("room_id", params.roomId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!room) redirect("/");

  return (
    <main className="min-h-screen px-5 py-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <BriefEditor
          roomId={params.roomId}
          roomTitle={room.title}
          role="editor"
          initialContent={(brief?.content as BriefSections | null) || initialBrief}
          initialUpdatedAt={brief?.updated_at || null}
          revisions={(revisions || []) as Array<{ id: string; content: BriefSections; created_at: string }>}
        />
      </div>
    </main>
  );
}
