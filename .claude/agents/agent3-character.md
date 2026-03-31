# Agent3 — 캐릭터 / 뽑기 / 덱 시스템

> **담당 폴더:** `/backend/api/characters/`
> **시작 조건:** Agent1 `types.ts` + Agent5 `supabaseClient.ts` 완료 후 시작
> **완료 기준:** 캐릭터 12종 완성 + 뽑기 1000회 시뮬레이션 확률 검증 통과

---

## 역할
캐릭터 마스터 데이터, 가챠(뽑기) 시스템, 덱 구성 API를 구현한다.

---

## 작업 목록 (반드시 이 순서대로)

### Step 1. data.ts — 캐릭터 12종 마스터 데이터

등급별 구성: **Normal 4종 / Rare 4종 / Epic 3종 / Legendary 1종**

#### 등급별 능력치 기준표
| 등급 | ATK 주사위 | DEF 주사위 | INT 보너스 | 어빌리티 |
|------|-----------|-----------|-----------|---------|
| Normal | 1D6 | 1D6 | +0 | 기본 1종 |
| Rare | 2D6 | 2D6 | +1 | 2종 |
| Epic | 3D6 | 3D6 | +2 | 3종 + 패시브 |
| Legendary | 4D6 | 4D6 | +4 | 3종 + 패시브 + 고유기 |

#### 클래스별 능력치 방향
| 클래스 | ATK | DEF | INT | MOV | 특징 |
|--------|-----|-----|-----|-----|------|
| King | 중간 | 중간 | 중간 | 2 | 올라운더 |
| Queen | 높음 | 낮음 | 낮음 | 1 | 극공격 |
| Rook | 낮음 | 높음 | 낮음 | 1 | 극방어 |
| Bishop | 낮음 | 중간 | 높음 | 2 | 지력 지원 |
| Knight | 중간 | 낮음 | 낮음 | 2 | 기동 |
| Pawn | 낮음 | 낮음 | 낮음 | 1 | 성장형 조커 |

#### 전설급 고유 어빌리티 (반드시 구현)
```typescript
// 철가면 — Destroy
{ effectType: 'ATK_FIX', value: 24, duration: 2 }
// 공격 주사위 합산값을 24로 고정 (2턴)

// 데미안 — Block
{ effectType: 'DEF_FIX', value: 24, duration: 2 }
// 방어 주사위 합산값을 24로 고정 (2턴)
// Destroy 맞대결 시 무승부 → 재전투

// 살라딘 — 순간이동
{ effectType: 'TELEPORT', value: 15, duration: 1 }
// 전방 1~15칸 랜덤 워프

// 흑태자 — GS
{ effectType: 'SPECIAL', value: 30, duration: 1 }
// 공격 30, 방어 18 고정. 가장 긴 충전 시간
```

---

### Step 2. gacha.ts — 뽑기 시스템

```typescript
// 확률 테이블
const GACHA_RATES = {
  Normal:    0.60,   // 60%
  Rare:      0.30,   // 30%
  Epic:      0.09,   // 9%
  Legendary: 0.01    // 1%
}

// 천장 시스템
const PITY_EPIC =      50   // 50회 미등장 시 Epic 확정
const PITY_LEGENDARY = 100  // 100회 미등장 시 Legendary 확정

// 비용
const GACHA_COST = {
  single_gp: 100,    // 1회 GP 100
  single_cp: 10,     // 1회 CP 10
  ten_gp:    900,    // 10연챠 GP 900 (10% 할인)
  ten_cp:    90      // 10연챠 CP 90
}

export async function singleGacha(userId: string, costType: 'GP' | 'CP'): Promise<Character>
export async function tenGacha(userId: string, costType: 'GP' | 'CP'): Promise<Character[]>
```

**천장 처리 로직:**
1. `gacha_logs`에서 userId의 Epic/Legendary 미등장 횟수 조회
2. pity_count >= 50 → 다음 뽑기에서 Epic 강제
3. pity_count >= 100 → 다음 뽑기에서 Legendary 강제
4. 뽑기 결과 `gacha_logs`에 기록, pity_count 업데이트

**중복 방지:** 포인트 차감은 트랜잭션으로 처리

---

### Step 3. deck.ts — 덱 편성 API

```typescript
// 덱 저장
export async function saveDeck(
  userId: string,
  body: { attackerId: string, defenderId: string, intelligenceId: string }
): Promise<Deck>

// 유효성 검사 필수
// ✅ 3개 캐릭터 모두 user_characters에 존재해야 함
// ✅ attackerId → attacker 포지션 가능한 클래스
// ✅ defenderId → defender 포지션 가능한 클래스
// ✅ intelligenceId → intelligence 포지션 가능한 클래스
// ✅ 같은 캐릭터 중복 배치 금지
```

---

### Step 4. collection.ts — 컬렉션 조회

```typescript
GET /api/characters           // 전체 캐릭터 마스터 목록
GET /api/characters/my        // 내 보유 캐릭터
GET /api/characters/:id       // 캐릭터 상세
```

---

### Step 5. routes.ts — Express 라우터 통합

```typescript
POST /api/characters/gacha        // 1회 뽑기
POST /api/characters/gacha/ten    // 10연챠
GET  /api/deck                    // 현재 덱 조회
POST /api/deck                    // 덱 저장
```

---

## 규칙
- **타입 import:** `import type { Character, Ability } from '../../../shared/gameLogic/types'`
- **DB 접근:** `import { supabase } from '../../lib/supabaseClient'`
- **포인트 차감은 반드시 트랜잭션** (Supabase RPC 사용)
- **뽑기 확률 테스트:** 1000회 시뮬레이션 후 실제 확률 ≈ 이론값 ±5% 이내
