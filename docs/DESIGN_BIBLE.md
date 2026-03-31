# FateDice — Design Bible v1.0
> **Design Director:** 총괄 디자인 디렉터
> **Created:** 2026-03-31
> **Status:** ACTIVE — 모든 에이전트 및 외주 작업자는 이 문서를 최우선 기준으로 삼는다.

---

## 0. 디자인 철학 (Design Philosophy)

> **"운명은 굴러간다 — 아름답게."**
> *"Fate Rolls — Beautifully."*

FateDice는 복고(Retro)와 현대(Modern)의 충돌이 아닌 **융합**이다.
클래식 창세기전 보드게임의 향수를 품되, 2026년의 감각으로 재해석한다.

### 3대 디자인 키워드
| # | 키워드 | 의미 |
|---|--------|------|
| 1 | **Mystical** | 주사위가 지배하는 운명적 세계관, 마법적 분위기 |
| 2 | **Competitive** | 명확한 승패, 긴장감, 전략의 날카로움 |
| 3 | **Playful** | 치비 캐릭터, 과장된 이펙트, 즐거운 경험 |

---

## 1. 아트 스타일 (Art Style)

### 1.1 전체 스타일 방향
**"Chibi Fantasy Neo-Retro"**

- 캐릭터: **2.5D 치비 애니메이션** (주사위의 잔영 Kakao 버전 참고)
- UI: **글래스모피즘 + 다크 판타지** (모던 모바일 게임 감각)
- 보드: **아이소메트릭 헥사곤** 타일 (3D 원근감, 환경 디테일 포함)
- 이펙트: **오버더톱(Over-the-Top)** — 주사위 굴림, 배틀, 태초귀환 모두 극적으로

### 1.2 참고 레퍼런스 방향
| 요소 | 참고 스타일 |
|------|------------|
| 캐릭터 일러스트 | 주사위의 잔영 for Kakao (치비, 밝은 채색) |
| 보드 환경 | 원작 창세기전 (판타지 자연 환경 헥사맵) |
| UI 패널 | 현대 TCG (Hearthstone, Marvel Snap 감각) |
| 배틀 이펙트 | 닌텐도 Mario Party × 프린세스메이커 느낌 |
| 태초귀환 | Dragon Ball/나루토급 과장된 연출 |

---

## 2. 컬러 팔레트 (Color Palette)

### 2.1 Primary Brand Colors
```
Primary Purple:    #7C3AED  (보라 — 운명, 신비)
Primary Gold:      #F59E0B  (금 — 전설, 승리)
Deep Navy:         #0F0B2E  (네이비 — 배경 기본)
Electric Blue:     #3B82F6  (블루 — 주사위, 활성)
```

### 2.2 Semantic Colors
```
[배경]
BG-Base:           #0F0B2E  (전체 배경)
BG-Panel:          rgba(255,255,255,0.05)  (글래스 패널)
BG-Panel-Border:   rgba(255,255,255,0.12)  (패널 테두리)
BG-Card:           #1A1542  (카드 배경)

[텍스트]
Text-Primary:      #F0EEFF  (주요 텍스트)
Text-Secondary:    rgba(240,238,255,0.55)  (보조 텍스트)
Text-Muted:        rgba(240,238,255,0.30)  (비활성 텍스트)

[등급 컬러]
Grade-Normal:      #9CA3AF  (일반 — 회색)
Grade-Rare:        #60A5FA  (레어 — 파랑)
Grade-Epic:        #A855F7  (에픽 — 보라)
Grade-Legendary:   #F59E0B  (레전더리 — 금)

[체스 클래스 컬러]
Class-King:        #EF4444  (킹 — 붉은 위엄)
Class-Queen:       #EC4899  (퀸 — 핑크 파워)
Class-Rook:        #6B7280  (룩 — 철회색)
Class-Bishop:      #8B5CF6  (비숍 — 신성 보라)
Class-Knight:      #10B981  (나이트 — 전투 녹색)
Class-Pawn:        #F97316  (폰 — 활기 주황)

[어트리뷰트 컬러]
Attr-Sword:        #EF4444  (검 — 붉은 전투)
Attr-Wand:         #8B5CF6  (완드 — 마법 보라)
Attr-Disk:         #F59E0B  (디스크 — 금 방어)
Attr-Cup:          #06B6D4  (컵 — 청록 힐링)

[상태 컬러]
Status-Win:        #10B981  (승리 — 초록)
Status-Lose:       #EF4444  (패배 — 빨강)
Status-Draw:       #6B7280  (무승부 — 회색)
Status-AG-Full:    #F59E0B  (AG 만충 — 금 발광)

[이펙트 컬러]
Genesis-Flash:     #FF0000  (태초귀환 레드 플래시)
Battle-Win-Glow:   #FFD700  (전투 승리 골드 글로우)
Dice-Glow:         #60A5FA  (주사위 파랑 빛)
```

### 2.3 그라디언트
```css
/* 히어로 배경 */
bg-hero: linear-gradient(135deg, #0F0B2E 0%, #1A0A3E 50%, #0D1B4E 100%);

/* 레전더리 카드 */
bg-legendary: linear-gradient(135deg, #78350F 0%, #F59E0B 50%, #78350F 100%);

/* 에픽 카드 */
bg-epic: linear-gradient(135deg, #4C1D95 0%, #A855F7 50%, #4C1D95 100%);

/* 레어 카드 */
bg-rare: linear-gradient(135deg, #1E3A8A 0%, #60A5FA 50%, #1E3A8A 100%);

/* CTA 버튼 */
bg-cta: linear-gradient(90deg, #7C3AED 0%, #5B21B6 100%);

/* 태초귀환 오버레이 */
bg-genesis: radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0) 70%);

/* AG 바 */
bg-ag-bar: linear-gradient(90deg, #7C3AED 0%, #F59E0B 100%);
```

---

## 3. 타이포그래피 (Typography)

### 3.1 폰트 스택
```
[제목/브랜드 — 한국어]
Primary: "Gmarket Sans" / "나눔스퀘어ExtraBold" (웹폰트)
Fallback: "Apple SD Gothic Neo", "Malgun Gothic", sans-serif

[제목/브랜드 — 영문]
Primary: "Rajdhani" / "Orbitron" (Google Fonts)
느낌: 판타지 + SF 느낌의 기하학적 폰트

[본문 — 한국어]
Primary: "Pretendard" (웹폰트 — 가독성 최우선)
Fallback: "Apple SD Gothic Neo", sans-serif

[UI 수치/스탯]
Primary: "Rajdhani" — 숫자가 선명하고 임팩트 있게
```

### 3.2 타입 스케일
```
[게임 타이틀] FateDice 로고
  font-size: clamp(48px, 8vw, 96px)
  font-weight: 900
  letter-spacing: -0.04em
  text-shadow: 0 0 30px rgba(124,58,237,0.8)

[섹션 헤딩] BATTLE / ROLL / RESULT
  font-size: clamp(32px, 5vw, 64px)
  font-weight: 900
  letter-spacing: 0.05em
  UPPERCASE 고정

[캐릭터 이름]
  font-size: 16-18px
  font-weight: 700
  letter-spacing: -0.01em

[스탯 수치] ATK/DEF/INT 수치
  font-size: 20-28px
  font-weight: 900
  font-family: Rajdhani
  color: 해당 등급 컬러

[UI 레이블]
  font-size: 11-12px
  font-weight: 700
  letter-spacing: 0.08em
  UPPERCASE
  color: Text-Secondary

[본문/설명]
  font-size: 14-15px
  line-height: 1.65
  font-weight: 400
  color: Text-Secondary
```

---

## 4. UI 컴포넌트 시스템 (UI Component System)

### 4.1 패널 & 카드 기본 규칙
```css
/* 기본 글래스 패널 */
.panel-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 캐릭터 카드 */
.card-character {
  width: 120px;  /* 사이드바 */
  height: 160px;
  border-radius: 12px;
  border: 2px solid [등급 컬러];
  box-shadow: 0 0 20px [등급 컬러 30%];
  overflow: hidden;
}

/* 액션 버튼 (CTA) */
.btn-primary {
  height: 44px;
  padding: 0 32px;
  border-radius: 10px;
  font-weight: 900;
  font-size: 15px;
  background: bg-cta;
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
  transition: transform 0.1s, box-shadow 0.1s;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.7);
}
.btn-primary:active {
  transform: translateY(0px) scale(0.97);
}
```

### 4.2 게임 UI 레이아웃 (1920×1080 기준)
```
┌─────────────────────────────────────────────────────┐
│ HEADER: 플레이어1 정보 | 턴 표시 | 플레이어2 정보  │ 60px
│         [avatar][name][AG-bar]  [TURN N]  [AG-bar][name][avatar]│
├────────┬────────────────────────────┬────────────────┤
│ LEFT   │                            │ RIGHT          │
│ PANEL  │     BOARD (Phaser Canvas)  │ PANEL          │
│ 160px  │                            │ 160px          │
│        │  - 헥사곤 타일             │                │
│[P1 덱] │  - 캐릭터 말              │[P2 덱]         │
│        │  - 애니메이션              │                │
│1.CL[img]│                           │1.CL[img]       │
│2.CL[img]│                           │2.CL[img]       │
│3.CL[img]│                           │3.CL[img]       │
│  ...   │                            │   ...          │
│        │                            │                │
├────────┴────────────────────────────┴────────────────┤
│ BOTTOM: 아이템 슬롯 | 주사위 굴리기 버튼 | 로그    │ 120px
│ [item1][item2][item3][item4] [🎲 ROLL] [채팅/로그] │
└─────────────────────────────────────────────────────┘
```

### 4.3 AG (Ability Gauge) 바 디자인
```
[형태] 수평 바, 가로 200px × 높이 12px
[배경] rgba(255,255,255,0.1), border-radius 999px
[충전] 그라디언트 fill: #7C3AED → #F59E0B (충전도에 따라 색상 변화)
[만충] 금색 펄스 애니메이션 + "ABILITY READY" 텍스트 팝업
[수치] 우측에 "82 / 100" 표기 (Rajdhani 폰트)
```

---

## 5. 보드 디자인 (Board Design)

### 5.1 헥사곤 타일 시스템
```
[타일 크기] 80px (외접원 반지름 기준)
[타일 간격] 4px gap

[타일 유형별 비주얼]
Type-Normal:    초원/돌길 텍스처, 연한 녹색 베이스
Type-Battle:    붉은 불꽃 문양, 검붉은 베이스
Type-Event:     빛나는 물음표(?), 파란 마법진
Type-Safe:      황금 방패 문양, 따뜻한 노란 베이스
Type-Start:     창세기전 문장(紋章), 흰빛 발광

[3D 효과]
- 아이소메트릭 투영 (Phaser.js tilemap)
- 타일 위/아래 면 분리 (측면 shadow 효과)
- 캐릭터 말 z-index는 항상 타일 위
- hover 시 타일이 살짝 위로 들림 (translateY -4px)
```

### 5.2 맵 환경 테마
```
기본 맵: "창세기전의 대륙" — 중세 판타지 자연
  - 나무, 성, 산, 강이 타일 사이 장식으로 배치
  - 배경: 하늘 + 구름 레이어 (패럴랙스 스크롤)
  - 조명: 따뜻한 황혼 빛 (Warm Fantasy)

전투 맵: "운명의 결전장" — 동일 환경, 붉은 조명 오버레이
```

---

## 6. 캐릭터 비주얼 시스템 (Character Visual System)

### 6.1 캐릭터 일러스트 규격
```
[게임 내 말(Piece)] 80×80px 스프라이트
  - 정면 기본자세 (아이소메트릭)
  - 4방향 걷기 애니메이션 (8프레임)
  - 대기 애니메이션 (4프레임)

[사이드바 포트레이트] 120×160px
  - 흉상 컷, 반신
  - 등급 테두리 빛나기 효과

[카드 일러스트] 280×380px
  - 전신 포즈, 포인트 컷
  - 배경: 체스 클래스 상징 문양

[배틀 스프라이트] 160×160px
  - 배틀 화면 VS 연출용
  - 전투 포즈 (공격 / 방어 / 스킬)
```

### 6.2 12 캐릭터 시각적 방향

| # | 이름 | 등급 | 체스 | 어트리뷰트 | 비주얼 컨셉 |
|---|------|------|------|-----------|------------|
| 1 | [Normal-ATK] | Normal | Knight | Sword | 활기찬 소년 검사, 붉은 망토 |
| 2 | [Normal-DEF] | Normal | Pawn | Disk | 두꺼운 방패를 든 소녀 기사 |
| 3 | [Normal-INT] | Normal | Bishop | Wand | 안경 쓴 마법사 소년, 파란 로브 |
| 4 | [Normal-BAL] | Normal | Rook | Cup | 밸런스형 치유사 소녀, 흰 드레스 |
| 5 | [Rare-ATK] | Rare | Queen | Sword | 쌍검 소녀 전사, 은색 갑옷 |
| 6 | [Rare-DEF] | Rare | Rook | Disk | 거대 방패 거인, 금빛 갑주 |
| 7 | [Rare-INT] | Rare | Bishop | Wand | 마법서 소환사, 보라 로브 |
| 8 | [Rare-BAL] | Rare | Knight | Cup | 쌍수 봉/치유사, 에메랄드 |
| 9 | [Epic-ATK] | Epic | King | Sword | 다크나이트 왕, 검은 갑옷+홍안 |
| 10 | [Epic-DEF] | Epic | Rook | Disk | 성벽 수호자, 신성한 빛 |
| 11 | [Epic-INT] | Epic | Queen | Wand | 마법왕 소녀, 별을 소환 |
| 12 | [Legendary] | Legendary | King | All | "창세의 왕" — 모든 속성의 결정체, 금빛 왕관+날개 |

### 6.3 레전더리 전용 비주얼 규칙
```
- 입장 연출: 전용 소환 애니메이션 (3초) 필수
- 카드 배경: 홀로그래픽 금빛 효과
- 이름 표시: 금색 + glow shadow
- 어빌리티 발동: 화면 전체 이펙트 (Destroy/Block/Teleport/GS 각각 고유)
```

---

## 7. 이펙트 & 애니메이션 시스템 (VFX System)

### 7.1 주사위 굴림 이펙트 (Dice Roll)
```
[트리거] 플레이어가 ROLL 버튼 클릭
[시퀀스]
  1. 버튼 클릭 → 버튼 pulse 애니메이션 (0.1s)
  2. 3D 주사위 모델 화면 중앙 등장 (스케일 0→1, 0.2s)
  3. 주사위 빠르게 회전 (spin + 물리 bounce, 1.0s)
  4. 주사위 감속 → 숫자 확정 (0.5s)
  5. 확정 숫자 강조 flash + 파란 파티클 발사 (0.3s)
  6. 주사위 사라지며 캐릭터 이동 시작

[주사위 외형]
  - 재질: 반투명 수정/유리 느낌, 내부 발광
  - 숫자: 금색 엠보싱 (1D6) / 삼각형 수정 면 (2D4)
  - 크기: 화면에서 시각적으로 120×120px
```

### 7.2 배틀 이펙트 (Battle VFX)
```
[트리거] 두 캐릭터가 같은 타일 이동
[시퀀스]
  1. 화면 중앙으로 두 캐릭터 포트레이트 슬라이드인 (0.3s)
  2. "BATTLE!" 텍스트 드롭 (위에서 쾅, 바운스, 0.4s)
     - 폰트: 90px, 900weight, 흰색+붉은 외곽선+흰 glow
  3. VS 심볼 등장 (rotate 360 + scale pulse)
  4. 주사위 양쪽에서 굴림 (동시)
  5. 합산 숫자 카운트업 애니메이션
  6. 승패 결정 → 승자 캐릭터 golden flash, 패자 shake
  7. 결과 텍스트: "WIN!" / "LOSE" fade-in

[수치 표시]
  - 좌우 대칭 배치
  - 승자 수치: 금색, 크기 120%, 발광
  - 패자 수치: 회색으로 fade
```

### 7.3 태초귀환 이펙트 (Genesis Return) ⚡ 최우선 시그니처 이펙트
```
[트리거] 배틀 수치 차이 ≥ 7
[시퀀스 — 총 4.5초]
  1. (0.0-0.3s) 화면 전체 빨간 플래시 — rgba(255,0,0,0.7) 오버레이
  2. (0.3-0.8s) 화면 전체 흑백(desaturate) + 슬로우모션
  3. (0.8-1.2s) "태 초 귀 환" 텍스트 한 글자씩 등장
     - 폰트: 72px, 900weight, 흰색, 자간 0.5em
     - 각 글자: scale 3→1 + opacity 0→1, 0.1s 딜레이
  4. (1.2-2.0s) 패자 캐릭터 위로 소용돌이 파티클 집중
     - 빨강/보라 파티클 200개, 캐릭터로 수렴
  5. (2.0-2.5s) 번개+빛 폭발, 캐릭터 사라짐 (scale 0)
  6. (2.5-3.5s) 시작 지점(position 0)에서 작은 빛이 나타남
     - 빛이 확장되며 캐릭터 materialise 애니메이션
  7. (3.5-4.5s) 화면 정상 복귀, "귀환 완료" 작은 텍스트 fade

[색상 팔레트]
  - 플래시: #FF0000
  - 파티클: #FF4444, #CC00FF, #FF0088
  - 귀환 빛: #FFFFFF → #FFD700

[사운드 연동] (8번 섹션 참조)
  - 배틀 드럼 → 빨간 플래시와 동기화
  - "천둥" 효과음 → 사라짐 순간
  - "신성한 종" 소리 → 귀환 materialise
```

### 7.4 어빌리티 이펙트 (Ability VFX) - 레전더리 전용
```
[Destroy] 대상 타일 파괴
  - 타일이 균열 → 파편 흩어짐 → 검은 구멍 생성
  - 색상: 검정+붉은 파티클, 균열선 흰빛

[Block] 이동 차단
  - 타일 위 투명한 장벽 등장 (빙결 결정체 모양)
  - 파란 얼음 파티클, 차가운 바람 이펙트

[Teleport] 순간이동
  - 별 파티클 → 캐릭터 사라짐 → 목적지에서 등장
  - 황금 별빛, 포털 링 애니메이션

[GS (Genesis Strike)] 극강 공격력 버프
  - 캐릭터 전체에 황금 오라 래핑
  - 폭발적 빛 방사, "GS" 텍스트 화면 중앙 등장
  - 색상: 금색+흰빛
```

---

## 8. 사운드 디자인 (Sound Design)

### 8.1 BGM 방향
```
[메인 로비] "Fate's Overture"
  장르: 오케스트라 + 일렉트로닉 하이브리드
  템포: 110-120 BPM
  분위기: 장엄함 + 설렘 (창세기전 원작 BGM 오마주)
  악기: 현악 + 피아노 + 신스패드 + 가벼운 퍼커션

[게임 보드 — 대기 중] "Rolling Destiny"
  장르: 판타지 어드벤처
  템포: 90-100 BPM
  분위기: 전략적 집중, 긴장감 유지
  악기: 하프 + 첼로 + 저음 신스

[게임 보드 — 배틀 중] "Clash of Fate"
  장르: 긴박한 오케스트라 + 드럼
  템포: 140-160 BPM (배틀 시작과 동시에 전환)
  분위기: 극적 긴장, 승부 결정의 순간
  악기: 브라스 + 퍼커션 + 신스 베이스

[결과 화면 — 승리] "Crown of the Victor"
  장르: 개선행진곡 느낌
  템포: 120 BPM
  분위기: 화려한 승리, 짧고 강렬하게 (8초 루프)

[결과 화면 — 패배] "Echoes of the Fallen"
  장르: 무거운 피아노 솔로
  분위기: 슬프지만 희망적인 여운 (다시 도전 유도)

[가챠 화면] "Wheel of Fate"
  장르: 신비로운 마법 + 동양적 오케스트라 혼합
  분위기: 기대감, 두근거림

[랭킹 화면] "Hall of Legend"
  장르: 영웅적 오케스트라
  분위기: 위엄, 경쟁 의지 고취
```

### 8.2 SFX (효과음) 목록
```
[주사위]
  sfx_dice_shake:     주사위 흔들림 (딸랑거리는 소리 + 살짝 마법 음)
  sfx_dice_roll:      굴러가는 소리 (1.2초)
  sfx_dice_land:      타닥! 착지 (강한 임팩트)
  sfx_dice_result:    숫자 확정 "띵~" (맑은 종 소리)

[캐릭터 이동]
  sfx_move_step:      발걸음 (타일 유형에 따라 3종 — 풀밭/돌/나무)
  sfx_move_arrive:    도착 (짧은 마법 소리)

[배틀]
  sfx_battle_start:   배틀 드럼롤 (2초)
  sfx_battle_clash:   충돌 "쾅!" 금속 효과음
  sfx_battle_win:     "짜짠!" 승리 효과음
  sfx_battle_lose:    "쿵..." 패배 효과음

[태초귀환 — 7개 전용 SFX]
  sfx_genesis_flash:  빨간 플래시 — 낮은 "붐" 충격파
  sfx_genesis_text:   글자 등장 — 금속성 울림 × 4
  sfx_genesis_storm:  소용돌이 파티클 — 바람 + 전기 합성음
  sfx_genesis_vanish: 사라짐 — 천둥 + 빛 폭발음
  sfx_genesis_bell:   귀환 materialise — 신성한 교회 종
  sfx_genesis_arrive: 귀환 완료 — 따뜻하고 짧은 멜로디

[어빌리티]
  sfx_ability_charge: AG 만충 — 에너지 축적음 (점진적 상승)
  sfx_ability_ready:  "ABILITY READY" — 짧은 팡파레
  sfx_ability_use:    어빌리티 발동 — 강력한 마법 폭발음

[UI]
  sfx_btn_click:      버튼 클릭 — 짧은 클릭음
  sfx_card_hover:     카드 호버 — 마법 반짝
  sfx_gacha_pull:     가챠 뽑기 — 두근두근 드럼롤
  sfx_gacha_legend:   레전더리 등장 — 오케스트라 스팅
  sfx_gacha_epic:     에픽 등장 — 보라빛 마법음
  sfx_rank_up:        랭크 상승 — 상승음 + 팡파레
```

### 8.3 오디오 믹싱 기준
```
BGM 볼륨:    0.4 (40%)  — 게임플레이 방해 최소화
SFX 볼륨:    0.8 (80%)  — 임팩트 있게
태초귀환 SFX: 1.0 (100%) — 클라이맥스 강조
보이스 볼륨:  0.9 (90%)  — 캐릭터 보이스 (v2 구현 시)
```

---

## 9. 화면별 디자인 명세 (Screen Design Spec)

### 9.1 홈 화면 (Home)
```
[레이아웃] 배경: bg-hero 그라디언트 + 별 파티클 (CSS)
[요소]
  - 중앙: FateDice 로고 (glow 애니메이션)
  - 로고 하단: 메인 캐릭터 3인 일러스트 (Legendary + 2 Epic)
  - 아래: [게임 시작] [컬렉션] [덱 구성] [랭킹] 버튼 4개
  - 우하단: 현재 시즌 정보 카드
[애니메이션]
  - 로고: 부드러운 발광 pulse
  - 캐릭터: 살짝 위아래 float (3초 주기)
  - 배경 별: 천천히 흐르는 parallax
```

### 9.2 가챠 화면 (Gacha)
```
[배경] 어둡고 신비로운 우주 + 수정 구슬
[연출 플로우]
  1. 소환 버튼 클릭 → 화면 어두워짐
  2. 수정 구슬 내부 회전 + 빛 증가
  3. 구슬 폭발 → 카드 등장 (등급에 따라 이펙트 다름)
  4. Normal/Rare: 카드 슬라이드인 (0.5s)
  5. Epic: 보라 나선 + 카드 등장 (1.5s)
  6. Legendary: 전용 컷신 연출 (3s) — 화면 전체 활용

[10연차 연출]
  - 카드 10장 순서대로 뒤집기 (타로카드 스타일)
  - 각 카드 뒤집을 때 등급 힌트 (빛 색상)
  - 마지막 카드: 가장 큰 이펙트
```

### 9.3 결과 화면 (Result)
```
[승리]
  - 황금 폭죽 파티클 전체 화면
  - "VICTORY!" 텍스트 (금색, 90px)
  - 내 캐릭터 승리 포즈 애니메이션
  - 획득 GP/ELO 변화 (+N) 카운트업

[패배]
  - 화면 약간 desaturate
  - "DEFEAT" 텍스트 (회색-흰, 70px)
  - 내 캐릭터 패배 포즈
  - ELO 변화 (-N) 표시
  - [다시 도전] 버튼 강조

[공통 스탯 테이블]
  배경: 반투명 패널
  항목: PLAYER | CLASS | COMPLETE% | GP | WIN RATE
  레퍼런스: 기존 게임 끝.png 레이아웃 계승
```

---

## 10. 로고 & 브랜드 아이덴티티 (Brand Identity)

### 10.1 FateDice 로고 규격
```
[로고마크] 입방체 주사위 안에 창세기전 문장(紋章)이 새겨진 형태
  - 주사위 면: 반투명 유리 효과
  - 내부 문장: 보라-금 그라디언트
  - 하단에 "FATE" + "DICE" 분리 타입페이스

[색상 버전]
  - Full Color: 금+보라 (메인 사용)
  - Dark BG: 흰색+금 글로우
  - Light BG: 딥 네이비+보라

[최소 사용 크기]
  - 인게임 사이드바: 80px 폭
  - 로딩 화면: 160px 폭
  - 타이틀 화면: clamp 기준 최대

[금지 사항]
  - 로고 회전 금지
  - 색상 임의 변경 금지
  - 압축 비율 변경 금지
```

### 10.2 아이콘 시스템
```
모든 인게임 아이콘은 통일된 스타일로:
  - 크기: 24px (UI), 32px (메뉴), 48px (강조)
  - 선 두께: 1.5px (stroke 기반)
  - 모서리: rounded (border-radius 느낌)
  - 색상: 기본 rgba(255,255,255,0.7), hover/active 시 흰색
  - 배경: 없음 (투명)
```

---

## 11. 반응형 & 해상도 대응 (Responsive)

```
[목표 해상도] 1920×1080 (PC 기준)
[최소 지원] 1280×720
[모바일 고려] v2 (후속 버전) — 현재 MVP는 PC Web 우선

[해상도별 보드 크기]
  1920px: 보드 폭 1200px
  1440px: 보드 폭 900px
  1280px: 보드 폭 800px

[사이드 패널 축소 규칙]
  < 1400px: 캐릭터 카드 80px로 축소
  < 1280px: 텍스트 레이블 숨김, 아이콘만
```

---

## 12. 개발 우선순위 (Implementation Priority)

```
[P0 — MVP 필수]
  □ 컬러 팔레트 CSS 변수 설정
  □ 타이포그래피 폰트 로드
  □ 기본 패널/카드 컴포넌트
  □ 보드 헥사곤 타일 기본 스타일
  □ 주사위 굴림 애니메이션
  □ 배틀 화면 레이아웃
  □ 태초귀환 이펙트 (시그니처)
  □ AG 바 디자인 + 애니메이션

[P1 — 품질 향상]
  □ 캐릭터 등급별 카드 이펙트
  □ 가챠 화면 연출
  □ 승/패 결과 화면 VFX
  □ 보드 환경 장식 (나무, 성 등)
  □ BGM 연동

[P2 — 폴리싱]
  □ 어빌리티 4종 이펙트 (Legendary)
  □ 10연차 카드 연출
  □ 캐릭터 입장 애니메이션
  □ 보이스 클립 (v2)
  □ 세이브 스팟 파티클
```

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-31 | 초안 작성 — Design Director 총괄 |
