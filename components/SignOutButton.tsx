"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-black hover:bg-zinc-50">
      로그아웃
    </button>
  );
}
