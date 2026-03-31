/**
 * items.ts — 아이템 카드 처리
 *
 * 아이템 목록 및 효과:
 *   날개          MOVE_FREE       before_roll  - 주사위 없이 자유 이동
 *   여신의 신발   MOVE_BONUS      before_roll  - 이동력 +N 보너스
 *   오리발        BATTLE_NULLIFY  during_battle - 전투 무효화 (무승부)
 *   체인지        SWAP_VALUES     during_battle - 공격/방어 합산값 교환
 *   자폭          MUTUAL_GENESIS  during_battle - 양측 태초 귀환
 *   발키리의 창   COPY_DICE       during_battle - 상대 주사위 절반 복사
 *   아마겟돈      STAT_HALVE      anytime       - 상대 스탯 절반
 *   홀수/짝수 저주 DICE_DESTROY   during_battle - 홀수/짝수 주사위 파괴
 *
 * battle.ts에서 실제 전투 계산 시 아이템을 참조하므로
 * 이 파일은 아이템 데이터 정의 + 인벤토리 관리에 집중
 *
 * 모든 함수는 순수 함수 — 부작용 없음
 */

import type { Item, ItemEffectType, Player } from './types'

// ── 아이템 마스터 데이터 ──────────────────────────────────────────

export const ITEM_CATALOG: Readonly<Item[]> = [
  {
    id:         'wings',
    name:       '날개',
    effectType: 'MOVE_FREE',
    value:      null,
    useTiming:  'before_roll',
  },
  {
    id:         'goddess_shoes',
    name:       '여신의 신발',
    effectType: 'MOVE_BONUS',
    value:      3,            // 이동력 +3
    useTiming:  'before_roll',
  },
  {
    id:         'flippers',
    name:       '오리발',
    effectType: 'BATTLE_NULLIFY',
    value:      null,
    useTiming:  'during_battle',
  },
  {
    id:         'change',
    name:       '체인지',
    effectType: 'SWAP_VALUES',
    value:      null,
    useTiming:  'during_battle',
  },
  {
    id:         'self_destruct',
    name:       '자폭',
    effectType: 'MUTUAL_GENESIS',
    value:      null,
    useTiming:  'during_battle',
  },
  {
    id:         'valkyrie_lance',
    name:       '발키리의 창',
    effectType: 'COPY_DICE',
    value:      null,         // 상대 def 주사위의 floor(n/2) 복사
    useTiming:  'during_battle',
  },
  {
    id:         'armageddon',
    name:       '아마겟돈',
    effectType: 'STAT_HALVE',
    value:      null,
    useTiming:  'anytime',
  },
  {
    id:         'odd_curse',
    name:       '홀수 저주',
    effectType: 'DICE_DESTROY',
    value:      1,            // 1 = 홀수 주사위 파괴
    useTiming:  'during_battle',
  },
  {
    id:         'even_curse',
    name:       '짝수 저주',
    effectType: 'DICE_DESTROY',
    value:      0,            // 0 = 짝수 주사위 파괴
    useTiming:  'during_battle',
  },
]

/** 최대 보유 아이템 수 */
export const MAX_ITEMS = 5

/**
 * 카탈로그에서 아이템 검색
 * @param id - 아이템 ID
 * @returns Item | undefined
 */
export function getItemById(id: string): Item | undefined {
  return ITEM_CATALOG.find(item => item.id === id)
}

/**
 * 아이템 사용 타이밍 검증
 * @param item    - 사용할 아이템
 * @param timing  - 현재 게임 타이밍
 * @returns 사용 가능하면 true
 */
export function canUseItem(item: Item, timing: Item['useTiming']): boolean {
  if (item.useTiming === 'anytime') return true
  return item.useTiming === timing
}

/**
 * 플레이어 인벤토리에 아이템 추가
 * 최대 5장을 초과하면 에러
 * @param player - 현재 플레이어
 * @param item   - 추가할 아이템
 * @returns 아이템이 추가된 새 플레이어 (불변)
 */
export function addItem(player: Player, item: Item): Player {
  if (player.items.length >= MAX_ITEMS) {
    throw new Error(`[items] 아이템 슬롯이 꽉 찼습니다 (최대 ${MAX_ITEMS}장)`)
  }
  return { ...player, items: [...player.items, item] }
}

/**
 * 플레이어 인벤토리에서 아이템 제거 (사용 후)
 * @param player - 현재 플레이어
 * @param itemId - 제거할 아이템 ID
 * @returns 아이템이 제거된 새 플레이어 (불변)
 */
export function removeItem(player: Player, itemId: string): Player {
  const index = player.items.findIndex(i => i.id === itemId)
  if (index === -1) {
    throw new Error(`[items] 아이템을 찾을 수 없습니다: ${itemId}`)
  }
  const newItems = [...player.items.slice(0, index), ...player.items.slice(index + 1)]
  return { ...player, items: newItems }
}

/**
 * DICE_DESTROY 효과 — 홀수/짝수 주사위 파괴
 * @param rolls    - 주사위 결과 배열
 * @param parity   - 1=홀수 제거, 0=짝수 제거
 * @returns 해당 홀짝이 아닌 주사위만 남긴 배열 (최솟값 보장: 0이면 [0])
 */
export function applyDiceDestroy(rolls: number[], parity: number): number[] {
  const filtered = rolls.filter(v => v % 2 !== parity % 2)
  // 모든 주사위가 파괴되면 0 반환 (합산 0 처리)
  return filtered.length > 0 ? filtered : [0]
}

/**
 * MOVE_FREE(날개) 처리 — 이동 방향/위치 선택 (UI에서 목적지 선택 후 호출)
 * @param player      - 현재 플레이어
 * @param destination - 선택한 목적지 타일 인덱스
 * @param boardSize   - 보드 크기
 * @returns 목적지로 이동한 새 플레이어
 */
export function applyMoveFree(player: Player, destination: number, boardSize: number): Player {
  const clampedDest = Math.max(0, Math.min(destination, boardSize - 1))
  return { ...player, position: clampedDest }
}

/**
 * 아이템 효과 타입으로 필터링
 */
export function getItemsByType(player: Player, effectType: ItemEffectType): Item[] {
  return player.items.filter(i => i.effectType === effectType)
}

/**
 * 플레이어가 특정 타이밍에 사용 가능한 아이템 목록
 */
export function getUsableItems(player: Player, timing: Item['useTiming']): Item[] {
  return player.items.filter(i => canUseItem(i, timing))
}
