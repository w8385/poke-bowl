# Google 로그인 + 투표 MVP 운영 메모

## 최소 구성
- Next.js standalone 앱 1개
- Postgres 1개
- Google OAuth 앱 1개

## 꼭 필요한 환경변수
### docker compose 루트 `.env`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 앱 내부
- `AUTH_SECRET`
- `AUTH_URL`
- `DATABASE_URL`

## Google OAuth 설정값
개발/로컬 기준 예시:
- Authorized JavaScript origins
  - `http://localhost:3001`
- Authorized redirect URIs
  - `http://localhost:3001/api/auth/callback/google`

배포 도메인 기준 예시:
- `https://poke-bowl.example.com`
- `https://poke-bowl.example.com/api/auth/callback/google`

## 현재 투표 모델
테이블: `votes`
- `pokemon_slug`
- `ball_key`
- `user_email`
- `created_at`

중복 방지:
- `unique (pokemon_slug, ball_key, user_email)`

## MVP 운영 원칙
- 로그인은 Google만 지원
- 투표는 운영자가 미리 올린 후보군 안에서만 가능
- 익명 사용자는 투표 불가, 조회만 가능
- 계정 삭제/프로필 동기화 같은 고급 기능은 아직 제외

## 남은 리스크
- 현재는 이메일 기준 중복 방지만 있음
- 동일 유저의 투표 변경/취소 기능은 아직 없음
- Google OAuth 실제 키를 넣기 전까지는 로그인 버튼이 비활성 상태로 보임
