# Poké Bowl MVP 작업안

## 현재 상태 요약
- 브랜치: `dev` (`origin/dev`와 동일)
- 커밋 상태: 워킹트리 변경 없음
- `client/`: Next 15 기본 템플릿만 있음
- `server/`: Nest 기본 템플릿만 있음
- 현재 바로 서비스 가치가 있는 코드는 사실상 없음
- `client` 의존성 미설치 상태라 `npm run build`는 `next: not found`로 실패

## 판단
- 지금 단계에서 `server/` 유지 비용이 실익보다 큼
- 우선은 **정적 Next 사이트 MVP**로 재가동하고, 데이터는 시트 -> 정적 JSON 생성으로 처리하는 게 맞음
- 합법성/비공식 안내는 한 블록에 섞지 말고 분리 필요

## 실제 TODO

### P0, 재가동 최소선
1. `client`를 프로젝트 소개 + 추천 리스트 뼈대가 있는 실제 랜딩으로 교체
2. Next 정적 export 기준으로 설정 정리
3. 추천 데이터용 JSON 스키마 확정
4. Google Sheet 입력 컬럼 확정
5. 시트 CSV/JSON -> 사이트용 JSON 변환 스크립트 초안 작성
6. 비공식 고지 / 저작권·상표 고지 문구 분리

### P1, 첫 공개 전
1. 포켓몬 30~50마리 샘플 데이터 입력
2. 볼 필터(세대, 색감, 희소성, 입수난도) 정의
3. 검색/필터 UI 추가
4. 데이터 검증 규칙 추가 (slug 중복, 볼 이름 허용값, 빈 필드)
5. 배포 대상 결정 (Vercel 또는 정적 호스팅)

### P2, 이후
1. 포켓몬 상세 페이지 분리
2. 볼 추천 근거 표시 강화
3. 도감작/레이드 보조 기능은 별도 라우트로 분리 검토
4. 서버 필요성이 생길 때만 API/Nest 재검토

## 권장 폴더 개편안

```text
poke-bowl/
  client/                  # Next 정적 사이트 MVP
    src/app/
    src/components/
    src/lib/
    public/data/           # 빌드 산출 JSON 배치 위치
  data/
    source/                # 시트 export 원본(csv/json)
    generated/             # 스크립트 생성 JSON
    schema/                # 데이터 계약 문서, 예시 파일
  scripts/
    build-ball-data.mjs    # source -> generated 변환
    sync-sheet-to-source.md
  docs/
    mvp-plan.md
    sheets-pipeline-draft.md
  server/                  # 당장 사용 안 함, 보류 명시
```

## 바로 정리할 것
- `server/README.md`에 보류 상태 명시
- `client/README.md`를 Poké Bowl 기준으로 교체
- `client/src/app/page.tsx` 기본 템플릿 제거
- `next.config.ts`에 정적 export 지향 설정 반영
