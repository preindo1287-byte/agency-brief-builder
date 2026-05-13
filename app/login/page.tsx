import AuthForm from "@/components/AuthForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-black text-amber-700">Agency Brief Builder</p>
          <h1 className="mt-3 text-5xl font-black leading-none tracking-[-0.06em] text-zinc-950">
            링크 하나로 같이 쓰는 실시간 브리프 룸
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-zinc-600">
            워크스페이스, 권한, 저장 이력, Realtime 동기화까지 포함한 실서비스형 브리프 작성 도구입니다.
          </p>
        </div>
        <AuthForm next={searchParams.next || "/"} />
      </section>
    </main>
  );
}
