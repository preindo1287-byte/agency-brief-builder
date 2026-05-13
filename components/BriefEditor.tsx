"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Copy, Save, Sparkles, Wand2 } from "lucide-react";
import { buildBrief, demoMemo, initialBrief, sectionMeta } from "@/lib/brief";
import { createClient } from "@/lib/supabase/client";
import type { BriefSections, Role } from "@/lib/types";

type Revision = {
  id: string;
  content: BriefSections;
  created_at: string;
};

type Props = {
  roomId: string;
  roomTitle: string;
  role: Role;
  initialContent: BriefSections;
  initialUpdatedAt: string | null;
  revisions: Revision[];
};

const initialAnswers = { q1: "", q2: "", q3: "" };

export default function BriefEditor({
  roomId,
  roomTitle,
  role,
  initialContent,
  initialUpdatedAt,
  revisions,
}: Props) {
  const [productName, setProductName] = useState("청귤 맥피즈");
  const [period, setPeriod] = useState("2026년 여름 시즌");
  const [memo, setMemo] = useState(demoMemo);
  const [brief, setBrief] = useState<BriefSections>(initialContent || initialBrief);
  const [answers, setAnswers] = useState(initialAnswers);
  const [showQuestions, setShowQuestions] = useState(false);
  const [notice, setNotice] = useState("같은 room에 접속한 사용자의 변경사항이 실시간으로 반영됩니다.");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(initialUpdatedAt);
  const [isPending, startTransition] = useTransition();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdatedAtRef = useRef(initialUpdatedAt);
  const didMountRef = useRef(false);
  const suppressNextAutosaveRef = useRef(false);
  const isEditable = role === "owner" || role === "editor";

  const completion = useMemo(() => {
    const filled = Object.values(brief).filter((item) => item.trim()).length;
    return Math.round((filled / sectionMeta.length) * 100);
  }, [brief]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "briefs", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const next = payload.new as { content?: BriefSections; updated_at?: string } | null;
          if (!next?.content || !next.updated_at) return;
          if (lastUpdatedAtRef.current && new Date(next.updated_at) <= new Date(lastUpdatedAtRef.current)) return;
          suppressNextAutosaveRef.current = true;
          setBrief(next.content);
          setLastUpdatedAt(next.updated_at);
          lastUpdatedAtRef.current = next.updated_at;
          setNotice("다른 참여자의 최신 변경사항을 반영했습니다.");
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setNotice("Realtime 연결됨: room 단위로 동기화 중입니다.");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  function generate() {
    setBrief(buildBrief({ memo, productName, period }));
    setShowQuestions(true);
    setNotice("브리프 표를 생성했습니다. 보완 질문에 답하면 더 실무형으로 정리됩니다.");
  }

  function refine() {
    const mergedAnswers = `우선 요청 업무: ${answers.q1}\n산출물 규격/수량/일정: ${answers.q2}\n필수/금지 표현: ${answers.q3}`;
    setBrief(buildBrief({ memo, productName, period, answers: mergedAnswers }));
    setNotice("보완 질문 답변을 반영했습니다.");
  }

  function updateBrief(key: keyof BriefSections, value: string) {
    if (!isEditable) return;
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  const save = useCallback(async (successMessage = "저장했습니다.") => {
    if (!isEditable) return;
    const res = await fetch(`/api/briefs/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: brief, clientUpdatedAt: lastUpdatedAt || undefined }),
    });
    const json = await res.json();
    if (!json.ok) {
      setNotice(json.error?.message || "저장에 실패했습니다.");
      return;
    }
    setLastUpdatedAt(json.data.updated_at);
    lastUpdatedAtRef.current = json.data.updated_at;
    setNotice(successMessage);
  }, [brief, isEditable, lastUpdatedAt, roomId]);

  useEffect(() => {
    if (!isEditable) return;
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (suppressNextAutosaveRef.current) {
      suppressNextAutosaveRef.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void save("자동 저장됨");
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [brief, isEditable, save]);

  function manualSave() {
    startTransition(() => void save("수동 저장을 완료했습니다."));
  }

  async function copyAll() {
    const text = sectionMeta
      .map((section) => `[${section.label.replace("\n", " ")}]\n${brief[section.key]}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    setNotice("브리프 전체 내용을 복사했습니다.");
  }

  async function copyRoomLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}?room=${roomId}`);
    setNotice("공유 링크를 복사했습니다. 링크를 받은 사람은 로그인 없이 함께 편집할 수 있습니다.");
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[410px_1fr]">
      <aside className="space-y-5">
        <section className="rounded-[2rem] bg-white/90 p-5 shadow-soft ring-1 ring-zinc-200 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-amber-700">Room</p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">{roomTitle}</h2>
              <p className="mt-1 text-xs font-bold text-zinc-500">권한: {role}</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-900">작성률 {completion}%</span>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-sm font-black">제품/캠페인명</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} disabled={!isEditable} className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950 disabled:bg-zinc-100" />
            <label className="text-sm font-black">기간</label>
            <input value={period} onChange={(e) => setPeriod(e.target.value)} disabled={!isEditable} className="rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-950 disabled:bg-zinc-100" />
            <label className="text-sm font-black">전체 배경 메모</label>
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} disabled={!isEditable} className="min-h-[260px] resize-y rounded-2xl border border-zinc-300 px-4 py-3 text-sm leading-6 outline-none focus:border-zinc-950 disabled:bg-zinc-100" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={generate} disabled={!isEditable} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-black text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300">
              <Sparkles size={16} /> 생성
            </button>
            <button onClick={manualSave} disabled={!isEditable || isPending} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black hover:bg-zinc-50 disabled:cursor-not-allowed disabled:bg-zinc-100">
              <Save size={16} /> 저장
            </button>
            <button onClick={copyAll} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black hover:bg-zinc-50">
              <Copy size={16} /> 전체 복사
            </button>
            <button onClick={copyRoomLink} className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-black hover:bg-zinc-50">
              링크 복사
            </button>
          </div>

          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-900">{notice}</p>
        </section>

        {showQuestions && (
          <section className="rounded-[2rem] bg-blue-50 p-5 shadow-soft ring-1 ring-blue-100">
            <h2 className="text-xl font-black text-blue-950">AI 보완 질문</h2>
            {(["q1", "q2", "q3"] as const).map((key, index) => (
              <label key={key} className="mt-4 block rounded-2xl bg-white p-4 text-sm font-black text-blue-950 ring-1 ring-blue-100">
                Q{index + 1}. {index === 0 ? "에이전시에 가장 우선 요청할 업무는 무엇인가요?" : index === 1 ? "산출물 규격/수량/제출 일정이 있나요?" : "반드시 포함하거나 피해야 할 표현이 있나요?"}
                <textarea value={answers[key]} onChange={(event) => setAnswers((prev) => ({ ...prev, [key]: event.target.value }))} className="mt-3 min-h-[76px] w-full resize-y rounded-xl border border-blue-200 px-3 py-2 text-sm leading-6 outline-none focus:border-blue-800" />
              </label>
            ))}
            <button onClick={refine} disabled={!isEditable} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-950 px-4 py-3 text-sm font-black text-white hover:bg-blue-800 disabled:bg-blue-200">
              <Wand2 size={16} /> 답변 반영해서 보완
            </button>
          </section>
        )}

        <section className="rounded-[2rem] bg-white/85 p-5 shadow-soft ring-1 ring-zinc-200">
          <h2 className="text-xl font-black">최근 변경 이력</h2>
          <div className="mt-3 space-y-2">
            {revisions.length ? revisions.map((revision) => (
              <button
                key={revision.id}
                onClick={() => setBrief(revision.content)}
                disabled={!isEditable}
                className="w-full rounded-2xl border border-zinc-200 bg-white p-3 text-left text-xs font-bold text-zinc-600 hover:border-zinc-950 disabled:cursor-not-allowed"
              >
                {new Date(revision.created_at).toLocaleString("ko-KR")} 버전 불러오기
              </button>
            )) : (
              <p className="rounded-2xl bg-zinc-100 p-3 text-sm font-bold text-zinc-500">아직 이력이 없습니다.</p>
            )}
          </div>
        </section>
      </aside>

      <main className="overflow-hidden rounded-[2rem] bg-white shadow-soft ring-1 ring-zinc-200">
        <div className="border-b-4 border-white bg-amber-50 px-5 py-4">
          <h2 className="text-xl font-black">브리프 표</h2>
          <p className="mt-1 text-sm font-semibold text-zinc-600">모든 텍스트는 React가 escape 렌더링하므로 HTML이 실행되지 않습니다.</p>
        </div>
        {sectionMeta.map((section) => (
          <div key={section.key} className="grid grid-cols-[190px_1fr] border-b-4 border-white bg-[#fff1c7] max-md:grid-cols-1">
            <div className="flex min-h-[130px] items-center justify-center whitespace-pre-line bg-[#f7b900] px-4 py-5 text-center text-base font-black leading-tight text-black max-md:min-h-0 max-md:justify-start max-md:text-left">{section.label}</div>
            <div className="p-3">
              <p className="mb-2 rounded-xl bg-white/55 px-3 py-2 text-xs font-black text-zinc-600">{section.guide}</p>
              <textarea value={brief[section.key]} onChange={(e) => updateBrief(section.key, e.target.value)} readOnly={!isEditable} placeholder={`• ${section.label.replace("\n", " ")} 내용이 여기에 생성됩니다.`} className="min-h-[140px] w-full resize-y border-0 bg-transparent px-3 py-2 text-[15px] font-semibold leading-7 text-black outline-none placeholder:text-zinc-500 read-only:cursor-default" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
