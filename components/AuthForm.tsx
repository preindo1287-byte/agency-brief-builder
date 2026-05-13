"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ next = "/" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("이메일 매직링크 또는 Google OAuth로 시작하세요.");
  const supabase = useMemo(() => createClient(), []);
  const isSupabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://example.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-anon-key";

  function redirectTo() {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }

  async function signInWithEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setMessage("Supabase 환경변수가 실제 프로젝트 값으로 설정되지 않아 매직링크를 보낼 수 없습니다.");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setMessage(error ? error.message : "메일함을 확인해 주세요. 로그인 링크를 보냈습니다.");
  }

  async function signInWithGoogle() {
    if (!isSupabaseConfigured) {
      setMessage("Supabase 환경변수가 실제 프로젝트 값으로 설정되지 않아 Google 로그인을 시작할 수 없습니다.");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setMessage(error.message);
  }

  return (
    <div className="rounded-[2rem] bg-white/85 p-6 shadow-soft ring-1 ring-zinc-200 backdrop-blur">
      <form onSubmit={signInWithEmail} className="space-y-4">
        <label className="block text-sm font-black text-zinc-700">이메일</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-950"
        />
        <button className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-700">
          매직링크 받기
        </button>
      </form>
      <button
        onClick={signInWithGoogle}
        className="mt-3 w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black hover:bg-zinc-50"
      >
        Google로 계속하기
      </button>
      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{message}</p>
      {!isSupabaseConfigured && (
        <p className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold leading-5 text-red-900">
          현재는 로컬 화면 확인 모드입니다. `.env.local`에 실제 `NEXT_PUBLIC_SUPABASE_URL`과
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣고 서버를 다시 시작해야 로그인이 됩니다.
        </p>
      )}
    </div>
  );
}
