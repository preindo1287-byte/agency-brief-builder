# Agency Brief Builder

로그인 없이 공유 링크를 받은 사람이 함께 편집할 수 있는 Next.js 14 기반 에이전시 브리프 빌더입니다.

## 목적

- 제작자가 room을 만들고 링크를 김하영님에게 전달합니다.
- 김하영님은 그 링크를 회사 사람들에게 공유합니다.
- 링크를 받은 사람은 어디서 접속하든 같은 웹페이지에서 동시에 브리프를 편집합니다.
- 로컬 PC나 로컬 망 전용이 아니며, Vercel + Supabase에 배포하면 인터넷 링크로 사용합니다.

## 파일 트리

```txt
.
├─ app/
│  ├─ api/
│  │  ├─ briefs/[roomId]/route.ts
│  │  └─ rooms/
│  │     ├─ [roomId]/route.ts
│  │     └─ route.ts
│  ├─ auth/callback/route.ts
│  ├─ login/page.tsx
│  ├─ room/[roomId]/page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  ├─ AuthForm.tsx
│  ├─ BriefEditor.tsx
│  └─ SignOutButton.tsx
├─ lib/
│  ├─ supabase/client.ts
│  ├─ supabase/server.ts
│  ├─ actions.ts
│  ├─ auth.ts
│  ├─ brief.ts
│  ├─ errors.ts
│  ├─ rate-limit.ts
│  └─ types.ts
├─ supabase/migrations/
│  ├─ 0001_init.sql
│  ├─ 0002_rls.sql
│  ├─ 0003_public_link_rooms.sql
│  └─ 0004_public_link_writes.sql
├─ .env.example
├─ next.config.js
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
└─ tsconfig.json
```

## 환경 변수

`.env.example`을 `.env.local`로 복사하고 Supabase 프로젝트 값을 넣습니다.

```bash
cp .env.example .env.local
```

필수 값:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RATE_LIMIT_MAX=60
RATE_LIMIT_WINDOW_MS=60000
```

## Supabase 설정

1. Supabase Cloud 프로젝트를 생성합니다.
2. SQL Editor에서 `supabase/migrations/0001_init.sql`을 실행합니다.
3. 이어서 `supabase/migrations/0002_rls.sql`을 실행합니다.
4. 이어서 `supabase/migrations/0003_public_link_rooms.sql`을 실행합니다.
5. 이어서 `supabase/migrations/0004_public_link_writes.sql`을 실행합니다.
6. Realtime > Publication에서 `briefs` 테이블이 포함되어 있는지 확인합니다.
7. 로그인은 현재 차순위이므로 Authentication 설정 없이도 공유 링크 편집은 동작합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 또는 `http://127.0.0.1:3000`으로 접속합니다.

로컬 주소는 내 PC에서만 안정적으로 접근됩니다. 회사 사람들이 어디서든 접속하려면 반드시 Vercel에 배포된 URL을 공유해야 합니다.

## 배포 절차

1. Supabase Cloud에 마이그레이션 SQL 4개를 순서대로 적용합니다.
2. Vercel에서 이 저장소를 Import합니다.
3. Vercel Environment Variables에 `.env.example`의 값을 등록합니다.
4. `NEXT_PUBLIC_SITE_URL`은 `https://your-app.vercel.app`으로 설정합니다.
5. Vercel Deploy를 실행합니다.
6. 배포된 `https://your-app.vercel.app`에서 room을 만듭니다.
7. 생성된 `/room/UUID` 링크를 김하영님에게 전달합니다.
8. 김하영님은 같은 링크를 회사 사람들에게 공유하면 됩니다.

## 테스트 체크리스트

- 로그인 없이 메인 페이지가 열리는지 확인합니다.
- 새 room 생성 후 `/room/[roomId]` 링크가 만들어지는지 확인합니다.
- `/room/[roomId]`와 `/?room=[roomId]` 진입이 모두 되는지 확인합니다.
- 다른 브라우저 또는 다른 PC에서 같은 링크로 접속 가능한지 확인합니다.
- 링크를 받은 사용자가 생성, 보완, 수동 편집, 자동 저장을 할 수 있는지 확인합니다.
- 두 브라우저에서 같은 room을 열고 한쪽 저장 시 다른 쪽에 Realtime 반영되는지 확인합니다.
- 저장 후 `brief_revisions`에 최근 이력이 쌓이는지 확인합니다.
- 전체 복사 버튼이 섹션별 텍스트를 클립보드에 복사하는지 확인합니다.

## Realtime 트러블슈팅

- Supabase Realtime publication에 `public.briefs`가 포함되어 있는지 확인합니다.
- 브라우저 개발자 도구 Network 탭에서 WebSocket 연결이 `101 Switching Protocols`로 열리는지 확인합니다.
- `0003_public_link_rooms.sql`이 적용되어 공개 링크 read 정책이 생겼는지 확인합니다.
- `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 배포 프로젝트와 같은지 확인합니다.
- Supabase Dashboard의 Database Replication/Realtime 설정에서 `briefs` 테이블이 활성화되어 있는지 확인합니다.
- `0004_public_link_writes.sql`이 적용되어 공개 링크 write 정책이 생겼는지 확인합니다.

## 보안 메모

- 현재 모델은 “링크를 아는 사람은 누구나 편집 가능”입니다.
- 링크가 외부에 전달되면 외부인도 편집할 수 있으므로 민감한 자료에는 권장하지 않습니다.
- 쓰기와 읽기는 Supabase RLS 공개 링크 정책으로 허용합니다.
- 비밀 service role key 없이 publishable key만으로 배포합니다.
- 입력값은 Zod로 검증합니다.
- 브리프 렌더링은 `textarea`/텍스트 값만 사용하며 `dangerouslySetInnerHTML`을 쓰지 않아 XSS 실행을 막습니다.
- rate limit은 서버 프로세스 메모리 기반의 간단한 보호막입니다. 대규모 운영에서는 Upstash Redis 또는 Vercel KV로 교체하세요.
