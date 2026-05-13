import Link from "next/link";
import { redirect } from "next/navigation";
import CreateRoomForm from "@/components/CreateRoomForm";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: { room?: string } }) {
  if (searchParams.room) redirect(`/room/${searchParams.room}`);

  return (
    <main className="min-h-screen px-5 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[2rem] bg-white/80 p-6 shadow-soft ring-1 ring-zinc-200 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-black text-amber-700">Public Link Room</p>
              <h1 className="mt-1 text-4xl font-black tracking-[-0.05em]">Agency Brief Builder</h1>
              <p className="mt-2 text-sm font-semibold text-zinc-500">
                로그인 없이 링크를 아는 사람은 누구나 같은 브리프를 편집합니다.
              </p>
            </div>
            <Link href="/login" className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-black hover:bg-zinc-50">
              로그인 기능은 나중에 켜기
            </Link>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <CreateRoomForm />

          <div className="rounded-[2rem] bg-white/85 p-5 shadow-soft ring-1 ring-zinc-200 backdrop-blur">
            <h2 className="text-2xl font-black tracking-[-0.04em]">공유 방식</h2>
            <div className="mt-4 space-y-3 text-sm font-bold leading-6 text-zinc-600">
              <p className="rounded-2xl bg-zinc-100 p-4">1. 이 화면에서 새 room을 만듭니다.</p>
              <p className="rounded-2xl bg-zinc-100 p-4">2. 생성된 `/room/UUID` 링크를 김하영님에게 전달합니다.</p>
              <p className="rounded-2xl bg-zinc-100 p-4">3. 김하영님과 회사 사람들은 같은 링크로 접속해 로그인 없이 함께 편집합니다.</p>
              <p className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                `127.0.0.1` 링크는 내 PC 전용입니다. 어디서나 접속하려면 Vercel 배포 URL을 공유해야 합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
