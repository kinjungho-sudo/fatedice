# shared/gameLogic — 게임 로직 엔진 명세

> **상태: Phase 1 구현 완료** (Agent1)  
> Agent2, Agent3, Agent4는 이 파일을 참조해서 함수를 사용한다.

---

## 파일 목록
| 파일 | 역할 | 상태 |
|------|------|------|
| types.ts | 전체 타입 정의 (★ 모든 Agent 공유) | ✅ |
| dice.ts | 주사위 이원화 시스템 | ✅ |
| battle.ts | 전투 판정 엔진 (태초 귀환) | ✅ |
| skills.ts | 어빌리티 게이지 시스템 | ✅ |
| board.ts | 보드 이동 엔진 | ✅ |
| items.ts | 아이템 카드 처리 | ✅ |

---

## import 방법 (다른 Agent용)
```typescript
import type { Character, GameState, BattleResult, Player, Item } from '../../shared/gameLogic/types'
import { rollMovement, rollDice, sumDice, applyIntBonus } from '../../shared/gameLogic/dice'
import { executeBattle, getBattleLoser, getBattleWinner } from '../../shared/gameLogic/battle'
import { chargeAG, chargeTileBonus, applyCursePenalty, canActivate, activateAbility, tickAbilityDuration } from '../../shared/gameLogic/skills'
import { initBoard, movePlayer, checkCollision, applyDOA, isGoal } from '../../shared/gameLogic/board'
import { ITEM_CATALOG, addItem, removeItem, canUseItem, getUsableItems } from '../../shared/gameLogic/items'
```

---

## 함수 완료 현황

### dice.ts
- [x] rollDice(count, faces): number[]
- [x] rollMovement(mov: 1|2): number  ← mov=1→1D6, mov=2→2D4
- [x] sumDice(rolls: number[]): number
- [x] applyIntBonus(sum, int): number
- [x] rollFixed(fixedValue): number[]  ← 어빌리티 고정값용

### battle.ts
- [x] executeBattle(attacker, defender, atkItem?, defItem?): BattleResult
  - COPY_DICE, STAT_HALVE 선처리
  - ATK_FIX(Destroy=24), DEF_FIX(Block=24) 어빌리티
  - INT 보너스 가산
  - BATTLE_NULLIFY(오리발) → 강제 무승부
  - MUTUAL_GENESIS(자폭) → 양측 태초 귀환
  - SWAP_VALUES(체인지) → 합산값 교환
  - ★ diff >= 7 → isGenesisReturn=true, loserNewPos=0
- [x] getBattleLoser(result): string | null
- [x] getBattleWinner(result): string | null

### skills.ts
- [x] chargeAG(player, movedTiles): Player  ← +movedTiles*10 AG
- [x] chargeTileBonus(player): Player  ← ability_charge 타일 +30
- [x] applyCursePenalty(player): Player  ← curse 타일 -10
- [x] canActivate(player): boolean  ← AG >= 100
- [x] activateAbility(player, ability): Player  ← AG=0 초기화
- [x] tickAbilityDuration(player): Player  ← duration-1, 0→null
- [x] applyAbilityBonus(player, contextType, baseValue): number
- [x] isAbilityActive(player): boolean

### board.ts
- [x] initBoard(size=50): BoardState
- [x] movePlayer(player, board, steps): MoveResult  ← 워프/DOA 자동처리
- [x] getTileEvent(board, position): {type, data}
- [x] checkCollision(players, position, excludeId): Player | null
- [x] applyDOA(player): Player  ← position=0
- [x] isGoal(player, board): boolean
- [x] getTile(board, index): Tile | null

### items.ts
- [x] ITEM_CATALOG: Item[] (9종 아이템)
- [x] getItemById(id): Item | undefined
- [x] canUseItem(item, timing): boolean
- [x] addItem(player, item): Player  ← 최대 5장
- [x] removeItem(player, itemId): Player
- [x] applyDiceDestroy(rolls, parity): number[]
- [x] applyMoveFree(player, dest, boardSize): Player
- [x] getUsableItems(player, timing): Item[]

---

## 보드 레이아웃 (50타일)
```
0        : 시작 (normal)
5,15,25  : ability_charge (+30 AG)
7        : warp_green → 22
8,20,35  : curse (-10 AG)
10,30    : blessing (+20 AG)
12       : DOA (태초 귀환)
17       : warp_yellow → 32
27       : warp_blue → 42
49       : goal (게임 종료)
나머지   : normal
```
