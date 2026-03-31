# FateDice — 프로젝트 현황 문서
> 마지막 업데이트: 2026-03-31  
> 이 문서는 "지금 뭐가 만들어졌는지"를 한눈에 파악하기 위한 기록입니다.

---

## 한 줄 요약

> **창세기전 "주사위의 잔영" 오마주 실시간 1v1/2v2 주사위 보드게임**  
> 8×8 보드 위를 주사위로 이동하며 상대와 만나면 카드 배틀을 벌이는 멀티플레이어 게임

---

## 전체 진행 상황

```
Phase 1 ✅ — 게임 로직 엔진 (shared/gameLogic)
Phase 2 ✅ — 백엔드 서버 (backend)
Phase 3 🔲 — 프론트엔드 (frontend) ← 아직 미구현
Phase 4 🔲 — 통합 테스트 & 배포
```

---

## 폴더 구조 설명

```
fatedice-claude-code/
├── shared/gameLogic/    ← ✅ 게임 규칙 코드 (모든 계산이 여기서)
├── backend/             ← ✅ 서버 코드 (API + 소켓 + DB)
│   └── src/
│       ├── api/         ← REST API 엔드포인트들
│       ├── socket/      ← 실시간 통신 (Socket.io)
│       └── lib/         ← DB 연결, 인증 미들웨어
├── frontend/            ← 🔲 화면 코드 (아직 비어있음)
└── docs/                ← 설계 문서들
```

---

## Phase 1 — 게임 로직 엔진 (`/shared/gameLogic/`)

게임의 "두뇌" 역할. 모든 계산이 여기서 일어납니다.  
테스트 96개 전부 통과 ✅

### 파일별 역할

| 파일 | 하는 일 | 핵심 내용 |
|------|---------|-----------|
| `types.ts` | 게임에서 쓰는 모든 자료형 정의 | 캐릭터, 플레이어, 게임 상태 등 |
| `dice.ts` | 주사위 굴리기 | MOV=1이면 1D6, MOV=2이면 2D4 |
| `battle.ts` | 전투 판정 | 공격/방어 주사위 합산, 태초귀환 판정 |
| `skills.ts` | 스킬(어빌리티) 처리 | AG 게이지 충전/발동, 효과 적용 |
| `board.ts` | 보드 이동 처리 | 충돌 감지, 목표지점 도착 판정 |
| `items.ts` | 아이템 효과 처리 | 날개, 오리발, 자폭 등 8종 |
| `index.ts` | 외부에서 import할 수 있게 한 곳에 모음 | |

### 게임 핵심 규칙 (쉽게 설명)

**이동:**
- MOV 1인 캐릭터: 주사위 1개 (1~6, 균등)
- MOV 2인 캐릭터: 주사위 2개 합산 (2~8, 4~6이 많이 나옴)

**전투 (같은 칸에서 만났을 때):**
1. 공격자: ATK 수만큼 D6 굴림 → 합산
2. 방어자: DEF 수만큼 D6 굴림 → 합산
3. 결과: 공격 합 > 방어 합이면 공격자 승리
4. **태초귀환**: 차이가 7 이상이면 "크리티컬" → 진 쪽이 시작 위치로 되돌아감

**어빌리티(AG) 게이지:**
- 이동, 전투, 보너스 칸 등을 통해 0~100까지 충전
- 100이 되면 캐릭터 특수기 발동 가능

---

## Phase 2 — 백엔드 서버 (`/backend/`)

실제 서버. 게임 방 만들기, 유저 인증, 데이터 저장을 담당합니다.  
포트 4000에서 실행. TypeScript 컴파일 에러 0개 ✅

### API 엔드포인트 목록

```
인증
  POST /api/auth/signup    — 회원가입
  POST /api/auth/login     — 로그인

캐릭터/덱
  GET  /api/characters     — 전체 캐릭터 목록
  POST /api/characters/gacha  — 캐릭터 뽑기
  GET  /api/deck           — 내 덱 조회
  POST /api/deck           — 덱 저장

랭킹
  GET  /api/ranking        — 랭킹 목록

포인트/재화
  GET  /api/points         — 내 GP 조회
  POST /api/cash           — CP(캐시) 관련

로비
  GET  /api/lobby/rooms    — 방 목록 조회
```

### 소켓 이벤트 흐름 (실시간 통신)

```
접속
  └─ lobby:join          — 로비에 입장

방 만들기
  └─ room:create         — 방 생성
  └─ room:join           — 방 참가
  └─ room:leave          — 방 나가기

게임 시작
  └─ game:ready          — 준비 완료
  └─ game:started        — 게임 시작 (서버가 전송)

인게임
  └─ game:roll_dice      — 주사위 굴리기 요청
  └─ game:dice_result    — 주사위 결과 (서버가 전송)
  └─ game:battle_result  — 전투 결과 (서버가 전송)
  └─ game:use_ability    — 스킬 사용
  └─ game:use_item       — 아이템 사용
  └─ game:state_update   — 전체 게임 상태 동기화 (30초마다)

게임 종료
  └─ game:ended          — 게임 결과 (서버가 전송)
```

### 데이터베이스 테이블 (Supabase)

| 테이블 | 담는 정보 |
|--------|----------|
| `users` | 유저 계정 (닉네임, GP, CP, ELO점수) |
| `characters` | 캐릭터 마스터 데이터 12종 |
| `user_characters` | 내가 보유한 캐릭터 목록 |
| `decks` | 내 덱 설정 (공격/방어/지력 슬롯) |
| `matches` | 게임 결과 기록 |
| `rankings` | ELO 기반 랭킹 |
| `gacha_logs` | 뽑기 기록 |
| + 3개 추가 | 포인트 트랜잭션, 아이템 보유, 방 상태 |

### 캐릭터 시스템

**12종 캐릭터**, 체스 기물 클래스 × 속성 조합:

| 클래스 | 설명 |
|--------|------|
| King | 공격/방어 균형형, 고HP |
| Queen | 전 능력치 최고, 레전더리 |
| Rook | 방어 특화, 고DEF |
| Bishop | 지력(INT) 특화 |
| Knight | 이동력 2, 기동성 최고 |
| Pawn | 수치는 낮지만 뽑기 대량 가능 |

**가챠 확률:**
```
Normal    60%  — GP(무료 재화)로 뽑기 가능
Rare      30%
Epic       9%
Legendary  1%  — CP(유료) 또는 10연속 시 천장 보장
```

**덱 구성:** 캐릭터 3장 필수 (공격자 1 + 방어자 1 + 지력 1)

---

## Phase 3 — 프론트엔드 (`/frontend/`)

**아직 미구현.** 디렉토리 뼈대만 잡혀있는 상태.

### 만들어야 할 화면 (7페이지)

```
/login          — 로그인/회원가입
/lobby          — 게임 로비 (방 목록, 매칭)
/game/[roomId]  — 실제 게임 화면 (Phaser.js 보드판)
/gacha          — 캐릭터 뽑기
/deck           — 덱 편집
/collection     — 보유 캐릭터 목록
/ranking        — 랭킹 화면
```

### 이미 만들어진 프론트엔드 파일

| 파일 | 역할 |
|------|------|
| `store/gameStore.ts` | 게임 상태 전역 저장소 (Zustand) |
| `lib/socket.ts` | 소켓 연결 관리 |
| `lib/api.ts` | 백엔드 API 호출 함수 모음 |

### 기술 스택 (프론트엔드)

- **Next.js 14** — 페이지 라우팅, SSR
- **TypeScript** — 타입 안전성
- **Tailwind CSS** — 스타일링
- **Phaser.js** — 게임 보드판 렌더링 (캔버스 기반)
- **Zustand** — 전역 상태 관리
- **Socket.io-client** — 실시간 통신

---

## 디자인 방향 (`/docs/DESIGN_BIBLE.md`)

| 항목 | 결정 사항 |
|------|----------|
| 아트 스타일 | "Chibi Fantasy Neo-Retro" — 치비 캐릭터 + 글래스모피즘 UI |
| 배경색 | Deep Navy `#0F0B2E` |
| 메인 컬러 | Purple `#7C3AED` + Gold `#F59E0B` |
| 보드 | 아이소메트릭 헥사곤 타일 80px |
| 시그니처 연출 | 태초귀환 — 4.5초 풀 연출 (빨간 플래시→슬로우모션→소용돌이→귀환) |
| 폰트 | Pretendard (한글) + Rajdhani (숫자) + Gmarket Sans (제목) |
| 사운드 | 오케스트라 + 일렉트로닉 하이브리드 BGM |

---

## 다음에 해야 할 일

### 즉시 가능한 것
- [ ] **Phase 3 시작** — Agent4가 프론트엔드 구현 가능한 상태
  - 백엔드 완성 ✅, 소켓 이벤트 명세 ✅, 타입 정의 ✅

### 나중에 할 것
- [ ] `gameSync.ts`의 `buildPartyFromDeck()` — 현재 더미 캐릭터 반환 중, 실제 DB 조회로 교체 필요
- [ ] Supabase에 `schema.sql` 실제 실행 (아직 미실행)
- [ ] `.env` 파일 설정 (Supabase URL/Key 입력)

---

## 로컬에서 실행하는 방법

```bash
# 1. 백엔드 실행
cd fatedice-claude-code/backend
npm install
# .env 파일 생성 후 Supabase 키 입력
npm run dev      # 포트 4000

# 2. 프론트엔드 실행 (Phase 3 완료 후)
cd fatedice-claude-code/frontend
npm install
npm run dev      # 포트 3000
```

**.env 파일 내용 (backend/.env):**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=xxxx
JWT_SECRET=your-secret
PORT=4000
```

---

## 에이전트 구조 (5명 분업 체계)

| 에이전트 | 담당 폴더 | 상태 |
|----------|----------|------|
| Agent1 | `/shared/gameLogic/` | ✅ 완료 |
| Agent2 | `/backend/socket/` | ✅ 완료 |
| Agent3 | `/backend/api/characters/` | ✅ 완료 |
| Agent4 | `/frontend/` | 🔲 시작 전 |
| Agent5 | `/backend/lib/` + `/backend/api/auth/` | ✅ 완료 |

**규칙:** 각 에이전트는 자기 폴더 외 수정 금지. 타입은 무조건 `shared/gameLogic/types.ts`에서 가져옴.
