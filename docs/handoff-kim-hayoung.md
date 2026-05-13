# 김하영님 인수인계서

## 1. 이 웹페이지의 목적

이 웹페이지는 에이전시 브리프를 여러 사람이 같은 링크에서 함께 작성하기 위한 공유 편집 페이지입니다.

김하영님이 브리프 내용을 구상하고, 제작자는 그 내용을 실제로 회사 사람들이 접속할 수 있는 웹페이지로 배포했습니다.

현재 목표는 로그인 없이 링크를 받은 사람이 자유롭게 접속해서 입력, 생성, 수정, 저장할 수 있게 하는 것입니다.

## 2. 실제 공유 링크

배포된 기본 사이트:

```txt
https://agency-brief-builder.vercel.app
```

room을 만들면 아래처럼 개별 편집 링크가 생깁니다.

```txt
https://agency-brief-builder.vercel.app/room/ROOM_ID
```

김하영님과 회사 사람들에게는 개별 room 링크를 공유하면 됩니다.

## 3. 사용 방법

1. 제작자가 `https://agency-brief-builder.vercel.app`에 접속합니다.
2. `room 만들기`를 눌러 새 room을 생성합니다.
3. 생성된 `/room/ROOM_ID` 주소를 복사합니다.
4. 김하영님에게 해당 링크를 전달합니다.
5. 김하영님은 회사 사람들에게 같은 링크를 전달합니다.
6. 링크를 받은 사람은 로그인 없이 같은 페이지에 들어와 편집할 수 있습니다.
7. `생성` 버튼으로 브리프 초안을 만들고, 직접 수정합니다.
8. `저장` 버튼을 누르거나 자동 저장을 기다립니다.
9. 다른 사람이 같은 링크로 들어오면 저장된 내용이 불러와집니다.

## 4. 저장과 동시 편집 구조

이 웹페이지는 Supabase라는 온라인 데이터베이스에 내용을 저장합니다.

저장되는 주요 정보:

- room 제목
- 브리프 섹션별 내용
- 최근 수정 시간
- 변경 이력

동시 편집 구조:

- 같은 room 링크에 접속한 사람들은 같은 `briefs` 데이터를 봅니다.
- 누군가 저장하면 Supabase Realtime을 통해 다른 사람 화면에도 최신 내용이 반영됩니다.
- 충돌 처리는 최신 저장값이 이기는 방식입니다.

주의:

- 링크를 아는 사람은 누구나 편집할 수 있습니다.
- 민감한 자료나 외부 공개가 어려운 자료에는 링크 공유 범위를 조심해야 합니다.

## 5. Git, GitHub가 필요한 이유

Git은 코드의 변경 이력을 저장하는 도구입니다.

GitHub는 그 Git 저장소를 인터넷에 올려 여러 기기에서 이어서 작업할 수 있게 해주는 서비스입니다.

이번 프로젝트는 아래 GitHub 저장소에 올라가 있습니다.

```txt
https://github.com/preindo1287-byte/agency-brief-builder
```

집 PC에서 이어서 작업하려면 GitHub에서 코드를 clone하면 됩니다.

```bash
git clone https://github.com/preindo1287-byte/agency-brief-builder.git
cd agency-brief-builder
npm install
npm run dev
```

## 6. 김하영님 노트북에서 GitHub 사용이 어려운 경우

회사 사내 규정 때문에 김하영님 노트북에서 GitHub, Git, 개발 도구 사용이 어렵다면 김하영님은 코드를 직접 만질 필요가 없습니다.

권장 운영 방식:

- 김하영님은 배포된 웹페이지 링크만 사용합니다.
- 브리프 내용 수정은 웹페이지에서 직접 합니다.
- 코드 수정, 기능 추가, 배포는 제작자 PC에서 진행합니다.
- 수정 요청은 문서나 메신저로 정리해서 제작자에게 전달합니다.

즉, 김하영님에게 필요한 것은 GitHub 계정이나 개발 환경이 아니라 `room` 공유 링크입니다.

## 7. 제작자가 무엇을 했는지

제작자는 다음 흐름으로 공유 웹페이지를 만들었습니다.

1. Next.js 14, React, TypeScript, Tailwind로 웹페이지 제작
2. Supabase 프로젝트 생성
3. Supabase에 `workspaces`, `rooms`, `briefs`, `brief_revisions` 등 DB 테이블 생성
4. 저장과 실시간 동기화를 위한 API 작성
5. Vercel에 웹앱 배포
6. Vercel 환경변수에 Supabase 연결값 등록
7. GitHub repository 생성 및 코드 push

현재 배포 구조:

```txt
사용자 브라우저
  -> Vercel에 배포된 Next.js 웹앱
  -> Supabase DB에 저장
  -> Supabase Realtime으로 동기화
```

## 8. 운영자가 알아야 할 계정/서비스

Vercel:

- 웹페이지를 인터넷에 배포하는 서비스
- 배포 링크를 제공함
- 현재 링크: `https://agency-brief-builder.vercel.app`

Supabase:

- 데이터 저장소
- room 내용, 브리프 내용, 변경 이력을 저장함

GitHub:

- 코드 저장소
- 집이나 다른 PC에서 이어서 개발할 때 사용

## 9. 문제가 생겼을 때 확인할 것

저장이 안 될 때:

- Vercel 환경변수에 `SUPABASE_SERVICE_ROLE_KEY`가 있는지 확인
- Supabase URL과 publishable key가 맞는지 확인
- `/api/briefs/ROOM_ID` 요청이 실패하는지 확인

다른 사람이 저장 내용을 못 볼 때:

- 같은 `/room/ROOM_ID` 링크에 접속했는지 확인
- 저장 버튼을 눌렀는지 확인
- 브라우저 새로고침 후 내용이 남아 있는지 확인

Realtime이 안 될 때:

- Supabase Realtime에서 `briefs` 테이블이 활성화되어 있는지 확인
- 그래도 저장된 내용은 새로고침하면 불러와져야 함

제목이 `????`로 보일 때:

- 한글 room 제목이 잘못 인코딩되어 생성된 오래된 room입니다.
- 새 room을 웹페이지에서 직접 생성하면 정상 한글 제목으로 만들어집니다.

## 10. 앞으로 개선하면 좋은 것

- room 제목 수정 기능
- 링크 비밀번호 기능
- viewer/editor 권한 기능
- 변경 이력 복원 기능
- 김하영님이 직접 room을 쉽게 만들 수 있는 관리자 화면
- 모바일 화면 최적화 강화
