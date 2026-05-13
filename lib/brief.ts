import { z } from "zod";
import type { BriefSections } from "@/lib/types";

export const sectionMeta = [
  { key: "background", label: "Background", guide: "캠페인/제품의 배경과 왜 지금 필요한지" },
  { key: "objective", label: "Communication\nObjective", guide: "고객 인식 또는 행동을 어떻게 바꿀지" },
  { key: "task", label: "Task", guide: "에이전시가 실제로 해야 할 업무" },
  { key: "target", label: "Target", guide: "누구에게, 어떤 상황에서 말할지" },
  { key: "considerations", label: "Considerations", guide: "제작 시 유의사항/필수 확인사항" },
  { key: "deliverables", label: "Agency\nDeliverables", guide: "에이전시가 제출해야 할 산출물" },
] as const;

export const briefSchema = z.object({
  background: z.string().max(8000),
  objective: z.string().max(8000),
  task: z.string().max(8000),
  target: z.string().max(8000),
  considerations: z.string().max(8000),
  deliverables: z.string().max(8000),
});

export const roomCreateSchema = z.object({
  title: z.string().trim().min(1).max(80).default("새 브리프 룸"),
});

export const roomUpdateSchema = z.object({
  roomId: z.string().uuid(),
  title: z.string().trim().min(1).max(80),
});

export const briefSaveSchema = z.object({
  roomId: z.string().uuid(),
  content: briefSchema,
  clientUpdatedAt: z.string().datetime().optional(),
});

export const initialBrief: BriefSections = {
  background: "",
  objective: "",
  task: "",
  target: "",
  considerations: "",
  deliverables: "",
};

export const demoMemo =
  "8~9월 제철을 맞는 제주 청귤은 지역성을 가진 원료로, 실제로 청귤청 형태로 가공되어 음료와 디저트 등 다양한 메뉴에 활용되고 있음.\n2026 TOK 충전 칠러자몽 - 청주 옥수수 버거 - 제주 청귤 맥피즈까지 한국의 맛은 전국적으로 확대되며 유명하지 않은 특산물을 홍보할 뿐 아니라, 그 지역의 특산품까지도 널리 홍보하고자 함.\n청귤이라는 원재료를 떠올리면 제주와 함께 맥도날드 맥피즈가 연상되었으면 함. 갈증나는 여름에 찾는 시원한 음료이자 묵직한 버거와 페어링되는 산뜻한 음료로 인식되었으면 좋겠음.\nSNS 영상, 매장 POP, 메뉴보드 적용까지 검토 필요.";

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function detectProduct(text: string, productName: string) {
  const typed = productName.trim();
  if (typed) return typed;
  if (text.includes("청귤") && text.includes("맥피즈")) return "청귤 맥피즈";
  if (text.includes("맥피즈")) return "맥피즈";
  if (text.includes("버거")) return "신제품 버거";
  if (text.includes("해피밀")) return "해피밀";
  if (text.includes("맥플러리")) return "맥플러리";
  return "해당 제품/캠페인";
}

export function buildBrief({
  memo,
  productName,
  period,
  answers,
}: {
  memo: string;
  productName: string;
  period: string;
  answers?: string;
}): BriefSections {
  const source = `${memo}\n${answers || ""}`;
  const product = detectProduct(source, productName);
  const isSummer = hasAny(source, ["여름", "시원", "청량", "탄산", "갈증", "8월", "9월"]);
  const isJeju = hasAny(source, ["제주", "지역", "특산물", "지역성"]);
  const hasCheonggyul = source.includes("청귤");
  const hasPairing = hasAny(source, ["버거", "페어링", "묵직한", "식사", "함께"]);
  const hasSocial = hasAny(source, ["SNS", "소셜", "릴스", "쇼츠", "인스타", "영상", "콘티"]);
  const hasStore = hasAny(source, ["매장", "POP", "포스터", "배너", "메뉴보드", "SOK", "DT"]);
  const material = hasCheonggyul
    ? "제주 청귤 원재료가 주는 상큼함과 지역성"
    : isJeju
      ? "제주 지역성이 주는 신뢰감과 차별성"
      : "제품 고유의 핵심 매력";
  const season = isSummer ? "여름철 갈증 해소와 청량한 음용 니즈" : "캠페인 시점의 소비자 니즈";
  const periodText = period.trim() || "판매/캠페인 기간 추가 확인 필요";
  const channelParts = [];
  if (hasStore) channelParts.push("매장 접점");
  if (hasSocial) channelParts.push("소셜/영상 콘텐츠");
  const channelText = channelParts.length ? channelParts.join(" 및 ") : "주요 노출 채널 추가 확인 필요";
  const practicalScope = [];
  if (hasSocial) practicalScope.push("[SNS/영상] 메인 메시지, 컷 구성, 썸네일/엔드카드 문구, 숏폼 전환 가능성을 제안한다.");
  if (hasStore) practicalScope.push("[매장 접점] POP, 메뉴보드, SOK 등 고객이 주문 전 확인하는 위치별 메시지 우선순위를 제안한다.");
  if (!hasSocial && !hasStore) practicalScope.push("[채널 미확정] 키비주얼, 메인 카피, 서브 카피, 적용 채널별 변형안을 우선 제안한다.");
  const deliverables = [
    "키비주얼 방향안: 제품, 원재료, 이용 장면이 한눈에 보이는 메인 비주얼 구조 포함",
  ];
  if (hasSocial) deliverables.push("메인 영상 또는 숏폼 영상 방향안: 콘티, 컷 구성, 주요 자막 카피, 썸네일/엔드카드 문구 포함");
  if (hasSocial) deliverables.push("SNS 소재안: 피드, 스토리, 릴스/쇼츠 등 적용 포맷별 카피와 비주얼 가이드 포함");
  if (hasStore) deliverables.push("매장 적용안: POP, 메뉴보드, SOK, 배너 등 접점별 메시지 적용 예시 포함");
  deliverables.push("카피 제안: 메인 카피 3안 이상, 서브 카피 3안 이상, CTA 문구 포함");
  deliverables.push("옵션별 비교표: 각 방향안의 컨셉, 핵심 카피, 비주얼 톤, 장점, 우려점, 추천 여부 정리");
  deliverables.push("최종 제작 전 확인 리스트: 규격, 수량, 제출 일정, 매체별 사이즈, 필수 문구, 내부 승인 필요 항목 정리");

  return {
    background:
      `• ${product}는 ${material}을 중심으로, ${season}에 맞춰 고객에게 제안할 수 있는 제품/캠페인이다.\n\n` +
      `• ${periodText} 기준으로 단순 제품 출시 안내를 넘어, 고객이 어떤 상황에서 ${product}를 선택하면 좋은지까지 함께 전달할 필요가 있다.\n\n` +
      `• ${isJeju ? "한국의 맛 캠페인 흐름 안에서 지역 특산물의 매력을 제품 경험으로 연결하는 역할을 한다." : "제품 고유의 매력을 고객 이용 상황과 연결하는 역할을 한다."}\n\n` +
      "• 확인되지 않은 시장 수치, 판매 성과, 소비자 반응은 임의로 단정하지 않고 추가 확인 후 반영한다.",
    objective:
      `• 1. ${product}의 제품 인지도 및 핵심 이미지 강화\n` +
      `  고객이 ${hasCheonggyul ? "청귤을 떠올렸을 때 제주와 함께 " : "제품 카테고리를 떠올렸을 때 "}${product}를 자연스럽게 연상하도록 메시지 구조를 설계한다.\n\n` +
      `• 2. 이용 상황에 맞는 제품 이미지 구축\n  ${season}를 반영해, ${product}가 지금 시점에 선택할 이유가 있는 제품으로 인식되도록 한다.\n\n` +
      `• 3. 구매 고려 단계로 이어지는 메시지 구조화\n  제품명, 핵심 소재, 이용 장면${hasPairing ? ", 버거와의 페어링" : ""}을 명확히 보여주어 관심에서 실제 주문까지 이어질 수 있도록 한다.`,
    task:
      `• [에이전시 요청 업무] ${product} 캠페인의 제작 방향을 제안한다. 단순 아이디어 제안이 아니라 실제 제작 가능한 카피, 비주얼, 채널 적용안까지 포함한다.\n\n` +
      `• [메시지 개발] 고객에게 가장 먼저 보여줄 메인 메시지 1개와 이를 보완하는 서브 메시지 구조를 제안한다. 메시지는 ${material}과 ${season}를 중심으로 구성한다.\n\n` +
      `• [비주얼 개발] 제품 컷, 원재료 이미지, 얼음/탄산감, 청량한 음용 장면${hasPairing ? ", 버거와 함께 마시고 싶은 페어링 상황" : ""}이 드러나는 키비주얼 방향을 제안한다.\n\n` +
      `• [채널별 적용] ${channelText} 환경에서 고객이 한눈에 이해할 수 있도록 접점별 메시지 우선순위와 표현 방식을 제안한다.\n\n` +
      `• ${practicalScope.join("\n\n• ")}\n\n` +
      "• [검토 방식] 최소 2~3개의 크리에이티브 방향안을 제시하고, 각 안별 장점, 우려점, 추천안을 함께 정리한다.\n\n" +
      "• [미확정 정보 처리] 가격, 판매 기간, 제품 구성, 법적 고지, 로고/BI 사용 기준 등 확정되지 않은 정보는 임의 제작하지 말고 ‘확인 필요’로 표시한다.",
    target:
      `• ${isSummer ? "시원하고 청량한 음료를 찾는 QSR 음료 고객" : "제품의 핵심 매력에 반응할 가능성이 높은 고객"}.\n\n` +
      `• ${hasPairing ? "버거와 함께 즐길 수 있는 산뜻한 페어링 음료를 찾는 고객." : "간식 또는 식사 상황에서 새로운 선택지를 찾는 고객."}\n\n` +
      `• ${isJeju ? "제주, 청귤, 지역 원재료 등 제품의 지역성과 원물 이미지를 긍정적으로 받아들이는 고객." : "제품의 신선함과 차별화 포인트에 반응하는 고객."}\n\n` +
      "• 연령대, 가격 민감도, 구매 빈도 등 세부 타깃 정보는 현재 입력만으로 확정하기 어려우므로 추가 확인 후 보완이 필요하다.",
    considerations:
      `• ${product}의 핵심 소재와 이미지가 흐려지지 않도록 ${material}을 시각적으로 명확하게 표현한다.\n\n` +
      `• 톤앤매너는 ${isSummer ? "청량한, 상큼한, 직관적인, 제품 중심의 톤" : "직관적인, 제품 중심의 톤"}으로 구성한다.\n\n` +
      "• 고객이 판매 조건, 혜택, 제품 구성, 원재료 함량, 효능 등을 오해할 수 있는 표현은 피한다.\n\n" +
      "• 브랜드 로고, 제품명, 가격, 판매 기간, 필수 고지 문구는 최종 제작 전 재확인한다.",
    deliverables: `• ${deliverables.join("\n\n• ")}`,
  };
}
