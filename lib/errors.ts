import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/lib/types";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiError>(
    { ok: false, error: { code, message, details } },
    { status },
  );
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "알 수 없는 오류가 발생했습니다.";
}
