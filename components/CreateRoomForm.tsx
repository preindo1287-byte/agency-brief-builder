"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CreateRoomForm() {
  const router = useRouter();
  const [title, setTitle] = useState("맥도날드 청귤 맥피즈 브리프");
  const [message, setMessage] = useState("생성 후 room 링크를 김하영님과 회사 사람들에게 공유하세요.");
  const [isPending, startTransition] = useTransition();

  async function createRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("room을 생성하는 중입니다.");

    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ title }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) {
      setMessage(result?.error?.message || "room 생성에 실패했습니다.");
      return;
    }

    startTransition(() => {
      router.push(`/room/${result.data.roomId}`);
    });
  }

  return (
    <form onSubmit={createRoom} className="rounded-[2rem] bg-zinc-950 p-5 text-white shadow-soft">
      <h2 className="text-2xl font-black tracking-[-0.04em]">새 room 생성</h2>
      <p className="mt-2 text-sm font-semibold text-zinc-300">{message}</p>
      <input
        name="title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="mt-5 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-zinc-400"
      />
      <button
        disabled={isPending}
        className="mt-3 w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "이동 중" : "room 만들기"}
      </button>
    </form>
  );
}
