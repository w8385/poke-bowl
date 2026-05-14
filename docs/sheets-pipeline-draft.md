# 시트 기반 데이터 파이프라인 초안

## 목표
운영자는 Google Sheet만 수정하고, 로컬 스크립트가 이를 정적 사이트용 JSON으로 변환한다.

## 원칙
- 서버 호출 없이 빌드 시점 데이터 고정
- 사람이 직접 수정하는 원본은 시트 1개
- 코드 저장소에는 export 결과(csv/json)만 반영 가능
- 과설계 금지, 우선 단일 추천 리스트만 처리

## 권장 시트 탭

### 1. `pokemon_ball_matches`
메인 데이터

| column | 설명 |
| --- | --- |
| dex | 전국도감 번호 |
| slug | URL slug, 예: `bulbasaur` |
| name_ko | 한글명 |
| name_en | 영문명 |
| primary_type | 주타입 |
| secondary_type | 부타입, 없으면 빈값 |
| palette_tags | 색감 태그, `green,natural` 식 |
| recommended_ball | 대표 추천 볼 |
| recommended_ball_reason | 대표 추천 한 줄 근거 |
| alt_balls | 대체 볼 목록, `friend-ball,dusk-ball` 식 |
| design_tags | 디자인 태그, `cute,royal,mechanic` 식 |
| obtain_note | 입수 메모 |
| legality_status | `official`, `limited`, `check` 중 하나 |
| legality_note | 합법성/입수 제한 관련 메모 |
| source_note | 추천 근거 메모 |
| published | `TRUE/FALSE` |

### 2. `ball_catalog`
볼 메타 데이터

| column | 설명 |
| --- | --- |
| ball_key | 내부 키, 예: `moon-ball` |
| ball_name_ko | 한글명 |
| ball_name_en | 영문명 |
| color_tags | `blue,night` 식 |
| rarity_tier | `common`, `rare`, `apricorn`, `special` |
| official_name | 공식 표기 |
| sort_order | 정렬값 |

### 3. `site_copy`
사이트 고정 문구

| key | ko | en |
| --- | --- | --- |
| unofficial_notice | 비공식 팬 프로젝트 안내 | ... |
| legal_notice | 포켓몬 및 관련 명칭의 권리 고지 | ... |

## 생성 산출물

### `data/generated/ball-matches.json`
```json
{
  "updatedAt": "2026-05-14T00:00:00Z",
  "pokemon": [
    {
      "dex": 1,
      "slug": "bulbasaur",
      "name": { "ko": "이상해씨", "en": "Bulbasaur" },
      "types": ["grass", "poison"],
      "paletteTags": ["green", "natural"],
      "recommendedBall": {
        "key": "friend-ball",
        "reason": "초록 톤과 자연 이미지가 가장 잘 맞음"
      },
      "altBalls": ["nest-ball"],
      "designTags": ["cute", "natural"],
      "obtainNote": "SV 기준 특별교환/포획 계획 확인 필요",
      "legality": {
        "status": "check",
        "note": "세대별 입수 가능 여부 교차확인 필요"
      },
      "sourceNote": "초안 추천"
    }
  ]
}
```

## 변환 흐름
1. 시트에서 CSV export
2. `data/source/*.csv` 저장
3. `scripts/build-ball-data.mjs` 실행
4. 검증 통과 시 `data/generated/*.json` 생성
5. `client/public/data/`로 복사 또는 빌드 전 참조

## 최소 검증 규칙
- `dex`, `slug`, `name_ko`, `recommended_ball` 필수
- `slug` 유일해야 함
- `recommended_ball`, `alt_balls`는 `ball_catalog.ball_key`에 존재해야 함
- `published != TRUE` 인 행은 제외
- `legality_status` 허용값 제한

## 운영 메모
- 합법성 문구는 추천 이유와 섞지 말 것
- 비공식 프로젝트 고지는 사이트 상단/하단 둘 중 한 곳에 고정
- 상표/권리 고지는 footer 또는 about에 별도 배치
