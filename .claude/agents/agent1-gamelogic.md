# Agent1 — 게임 로직 엔진

> **담당 폴더:** `/shared/gameLogic/`
> **시작 조건:** 즉시 시작 (1순위 — 모든 Agent가 의존)
> **완료 기준:** types.ts export 완료 + 전체 함수 Jest 테스트 통과 + README.md 작성

---

## 역할
FateDice의 모든 게임 계산 로직을 **순수 함수**로 구현한다.
UI, 소켓, DB는 절대 건드리지 않는다.

---

## 작업 목록 (반드시 이 순서대로)

### Step 1. types.ts ← 가장 먼저, 가장 중요
다른 모든 Agent가 이 파일에 의존한다. 완성 즉시 알린다.

```typescript
// 캐릭터 클래스 (체스 기물)
type ChessClass = 'King' | 'Queen' | 'Rook' | 'Bishop' | 'Knight' | 'Pawn'

// 캐릭터 등급
type CharacterGrade = 'Normal' | 'Rare' | 'Epic' | 'Legendary'

// 캐릭터 속성
type CharacterAttribute = 'Sword' | 'Wand' | 'Disk' | 'Cup'

// 파티 슬롯 포지션
type PartySlot = 'attacker' | 'defender' | 'intelligence'

interface CharacterStats {
  mov:  1 | 2     // 이동력: 1=1D6, 2=2D4
  atk:  number    // 공격 주사위 개수 (D6 기준)
  def:  number    // 방어 주사위 개수 (D6 기준)
  int:  number    // 지력 고정 보너스 (주사위 없음)
  hp:   number    // 체력
}

interface Ability {
  id:         string
  name:       string
  attribute:  CharacterAttribute
  effectType: 'ATK_FIX' | 'DEF_FIX' | 'ATK_BONUS' | 'DEF_BONUS'
            | 'TELEPORT' | 'INT_BONUS' | 'MOV_BONUS' | 'SPECIAL'
  value:      number    // 고정값 또는 보너스 수치
  duration:   number    // 지속 턴 수
}

interface Character {
  id:         string
  name:       string
  class:      ChessClass
  grade:      CharacterGrade
  attribute:  CharacterAttribute
  stats:      CharacterStats
  abilities:  Ability[]
  imageUrl:   string
}

interface Party {
  attacker:     Character
  defender:     Character
  intelligence: Character
}

interface Player {
  id:            string
  userId:        string
  nickname:      string
  party:         Party
  position:      number       // 보드 타일 인덱스 (0 = 시작)
  ag:            number       // 어빌리티 게이지 0~100
  items:         Item[]       // 보유 아이템 최대 5장
  activeAbility: Ability | null
  isConnected:   boolean
}

type GamePhase = 'waiting' | 'rolling' | 'moving' | 'battle'
               | 'skill' | 'itemUse' | 'result' | 'finished'

interface GameState {
  roomId:      string
  mode:        '1v1' | '2v2'
  players:     Player[]
  currentTurn: string         // 현재 턴 playerId
  turnNumber:  number
  phase:       GamePhase
  boardState:  BoardState
  winner:      string | null
  startedAt:   number         // timestamp
}

interface BattleResult {
  attackerId:      string
  defenderId:      string
  atkRolls:        number[]
  defRolls:        number[]
  atkTotal:        number     // 합산 + INT 보너스
  defTotal:        number     // 합산 + INT 보너스
  diff:            number     // |atkTotal - defTotal|
  winner:          'attacker' | 'defender' | 'draw'
  isGenesisReturn: boolean    // diff >= 7 → 태초 귀환
  loserNewPos:     number     // 패배자 이동 후 위치
}

type TileType = 'normal' | 'warp_green' | 'warp_yellow' | 'warp_blue'
              | 'doa' | 'ability_charge' | 'blessing' | 'curse' | 'goal'

interface Tile {
  index:      number
  type:       TileType
  warpTarget: number | null
}

interface BoardState {
  tiles:      Tile[]
  totalTiles: number
}

type ItemEffectType = 'MOVE_FREE' | 'MOVE_BONUS' | 'BATTLE_NULLIFY'
                   | 'SWAP_VALUES' | 'MUTUAL_GENESIS' | 'COPY_DICE'
                   | 'STAT_HALVE' | 'DICE_DESTROY'

interface Item {
  id:         string
  name:       string
  effectType: ItemEffectType
  value:      number | null
  useTiming:  'before_roll' | 'during_battle' | 'anytime'
}

// 모든 타입 export
export type {
  ChessClass, CharacterGrade, CharacterAttribute, PartySlot,
  CharacterStats, Ability, Character, Party, Player,
  GamePhase, GameState, BattleResult,
  TileType, Tile, BoardState,
  ItemEffectType, Item
}
```

---

### Step 2. dice.ts — 주사위 이원화 시스템

```typescript
/**
 * 주사위 이원화 핵심 규칙:
 * mov = 1 → 1D6 (1~6, 균등 분포 — 예측 불가)
 * mov = 2 → 2D4 (2~8, 삼각 분포 — 평균 5 집중, 전략적)
 */
export function rollMovement(mov: 1 | 2): number
export function rollDice(count: number, faces: number): number[]
export function sumDice(rolls: number[]): number
export function applyIntBonus(sum: number, int: number): number
```

**테스트 케이스 필수:**
- rollMovement(1) → 항상 1~6 범위
- rollMovement(2) → 항상 2~8 범위
- 1000회 롤 분포 검증 (2D4 평균 ≈ 5)

---

### Step 3. battle.ts — 전투 판정 엔진

**핵심 알고리즘:**
```typescript
export function executeBattle(
  attacker: Player,
  defender: Player,
  attackerItem?: Item,
  defenderItem?: Item
): BattleResult {
  // 1. 아이템 선처리 (COPY_DICE = 발키리의 창)
  let atkCount = attacker.party.attacker.stats.atk
  let defCount = defender.party.defender.stats.def

  if (attackerItem?.effectType === 'COPY_DICE') {
    atkCount += Math.floor(defCount / 2)
  }

  // 2. 어빌리티 고정값 처리 (ATK_FIX = Destroy, DEF_FIX = Block)
  // Destroy: 공격 24 고정 / Block: 방어 24 고정

  // 3. 주사위 롤
  const atkRolls = rollDice(atkCount, 6)
  const defRolls = rollDice(defCount, 6)

  // 4. 지력 보너스 가산
  const atkTotal = sumDice(atkRolls) + attacker.party.intelligence.stats.int
  const defTotal = sumDice(defRolls) + defender.party.intelligence.stats.int

  // 5. 체인지 아이템 처리 (SWAP_VALUES)
  // 6. 승패 판정
  const diff = Math.abs(finalAtk - finalDef)
  const winner = finalAtk > finalDef ? 'attacker' : finalAtk < finalDef ? 'defender' : 'draw'

  // 7. ★ 태초 귀환 판정 (핵심 규칙)
  const isGenesisReturn = diff >= 7
  const loserNewPos = isGenesisReturn ? 0 : Math.max(0, loser.position - diff)
}
```

**테스트 케이스 필수:**
- diff = 7 → isGenesisReturn = true
- diff = 6 → isGenesisReturn = false
- Destroy vs Block → 무승부 (24 vs 24)
- 체인지 아이템 적용 시 값 교환 확인
- 발키리의 창 → 상대 주사위 절반 복사 확인

---

### Step 4. skills.ts — 어빌리티 게이지 시스템

```typescript
// AG 충전 공식
export function chargeAG(player: Player, movedTiles: number): Player
// AG = Math.min(100, AG + (movedTiles * multiplier))

export function canActivate(player: Player): boolean  // AG >= 100
export function activateAbility(player: Player, abilityId: string): Player
export function tickAbilityDuration(player: Player): Player  // 턴 종료 시 duration - 1
export function applyPassive(player: Player, event: string): Player
```

---

### Step 5. board.ts — 보드 엔진

```typescript
export function initBoard(size: number): BoardState
export function movePlayer(player: Player, board: BoardState, steps: number): { player: Player, path: number[] }
export function getTileEvent(board: BoardState, position: number): { type: TileType, data: any }
export function checkCollision(players: Player[], position: number, excludeId: string): Player | null
export function applyDOA(player: Player): Player  // 주사위 차이 >= 3 → 태초 귀환
export function isGoal(player: Player, board: BoardState): boolean
```

---

### Step 6. items.ts — 아이템 카드 처리

| 아이템 | effectType | 처리 시점 |
|--------|------------|----------|
| 날개 | MOVE_FREE | before_roll |
| 여신의 신발 | MOVE_BONUS | before_roll |
| 오리발 | BATTLE_NULLIFY | during_battle |
| 체인지 | SWAP_VALUES | during_battle |
| 자폭 | MUTUAL_GENESIS | during_battle |
| 발키리의 창 | COPY_DICE | during_battle |
| 아마겟돈 | STAT_HALVE | anytime |
| 홀수/짝수 저주 | DICE_DESTROY | during_battle |

---

### Step 7. README.md — 함수 명세 문서
완료된 모든 함수를 목록화. Agent2, Agent3, Agent4가 참조.

---

## 규칙
- **순수 함수만 작성** — 같은 입력 → 항상 같은 출력
- **부작용 절대 금지** — API 호출, DB 접근, console.log 없음
- **모든 함수 JSDoc 주석 필수**
- **테스트 파일:** `*.test.ts` 각 파일 옆에 작성
- **타입 import:** 이 폴더 내 types.ts에서만
