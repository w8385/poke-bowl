# Poké Bowl Client

Poké Bowl 프론트엔드 MVP.

## 방향
- Next.js 기반 MVP
- 데이터는 Google Sheet export -> 로컬 변환 스크립트 -> `public/data/*.json`
- 현재 목표는 포켓몬별 볼맞춤 추천 + 로그인 + 투표 MVP

## 데이터 소스 역할
- **PokeAPI**: 구조화 기초 데이터의 기본축
- **Serebii**: 볼/입수 가능 여부, 예외 검증의 1차 기준
- **Pokémon Database**: 사람이 읽는 기본 사실 보조 검증
- **Bulbapedia**: 예외 케이스 보조 참고

## 로컬 실행
```bash
npm install
npm run dev
```

## 정적 빌드
```bash
npm install
npm run build
```

## Docker 배포
```bash
cd ..
docker compose up --build -d
```

- 기본 포트: `3001`
- 브라우저: `http://localhost:3001`

## 관련 경로
- `src/app/page.tsx`: 현재 MVP 랜딩/샘플 화면
- `public/data/ball-matches.json`: 사이트가 읽을 정적 데이터
- `../docs/mvp-plan.md`: 실제 작업안
- `../docs/sheets-pipeline-draft.md`: 시트 기반 데이터 초안
