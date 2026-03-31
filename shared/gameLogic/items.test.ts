import {
  ITEM_CATALOG, MAX_ITEMS,
  getItemById, canUseItem,
  addItem, removeItem,
  applyDiceDestroy, applyMoveFree,
  getUsableItems,
} from './items'
import type { Player, Item } from './types'

function makePlayer(items: Item[] = []): Player {
  return {
    id: 'P1', userId: 'u1', nickname: 'P1',
    party: {
      attacker:     { id: 'a', name: 'A', class: 'Knight', grade: 'Normal', attribute: 'Sword', stats: { mov: 1, atk: 2, def: 1, int: 0, hp: 10 }, abilities: [], imageUrl: '' },
      defender:     { id: 'b', name: 'B', class: 'Rook',   grade: 'Normal', attribute: 'Disk',  stats: { mov: 1, atk: 1, def: 2, int: 0, hp: 10 }, abilities: [], imageUrl: '' },
      intelligence: { id: 'c', name: 'C', class: 'Bishop', grade: 'Normal', attribute: 'Wand',  stats: { mov: 1, atk: 0, def: 0, int: 1, hp: 10 }, abilities: [], imageUrl: '' },
    },
    position: 10, ag: 0, items,
    activeAbility: null, isConnected: true,
  }
}

const wings       = ITEM_CATALOG.find(i => i.id === 'wings')!
const flippers    = ITEM_CATALOG.find(i => i.id === 'flippers')!
const armageddon  = ITEM_CATALOG.find(i => i.id === 'armageddon')!
const oddCurse    = ITEM_CATALOG.find(i => i.id === 'odd_curse')!
const evenCurse   = ITEM_CATALOG.find(i => i.id === 'even_curse')!

describe('ITEM_CATALOG', () => {
  test('9개 아이템이 정의되어 있다', () => {
    expect(ITEM_CATALOG).toHaveLength(9)
  })

  test('모든 아이템이 id, name, effectType, useTiming을 가진다', () => {
    ITEM_CATALOG.forEach(item => {
      expect(item.id).toBeTruthy()
      expect(item.name).toBeTruthy()
      expect(item.effectType).toBeTruthy()
      expect(['before_roll', 'during_battle', 'anytime']).toContain(item.useTiming)
    })
  })
})

describe('getItemById', () => {
  test('존재하는 ID → Item 반환', () => {
    expect(getItemById('wings')?.id).toBe('wings')
  })

  test('없는 ID → undefined 반환', () => {
    expect(getItemById('nonexistent')).toBeUndefined()
  })
})

describe('canUseItem', () => {
  test('날개(before_roll)는 before_roll 타이밍에만 사용 가능', () => {
    expect(canUseItem(wings, 'before_roll')).toBe(true)
    expect(canUseItem(wings, 'during_battle')).toBe(false)
  })

  test('오리발(during_battle)은 during_battle 타이밍에만 사용 가능', () => {
    expect(canUseItem(flippers, 'during_battle')).toBe(true)
    expect(canUseItem(flippers, 'before_roll')).toBe(false)
  })

  test('아마겟돈(anytime)은 모든 타이밍에 사용 가능', () => {
    expect(canUseItem(armageddon, 'before_roll')).toBe(true)
    expect(canUseItem(armageddon, 'during_battle')).toBe(true)
    expect(canUseItem(armageddon, 'anytime')).toBe(true)
  })
})

describe('addItem', () => {
  test('아이템을 인벤토리에 추가한다', () => {
    const p = makePlayer([])
    const result = addItem(p, wings)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('wings')
  })

  test(`${MAX_ITEMS}장 초과 시 에러를 던진다`, () => {
    const fullItems = ITEM_CATALOG.slice(0, MAX_ITEMS)
    const p = makePlayer(fullItems)
    expect(() => addItem(p, wings)).toThrow()
  })

  test('원본 플레이어 불변성 유지', () => {
    const p = makePlayer([])
    addItem(p, wings)
    expect(p.items).toHaveLength(0)
  })
})

describe('removeItem', () => {
  test('아이템을 인벤토리에서 제거한다', () => {
    const p = makePlayer([wings, flippers])
    const result = removeItem(p, 'wings')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('flippers')
  })

  test('없는 아이템 제거 시 에러를 던진다', () => {
    const p = makePlayer([wings])
    expect(() => removeItem(p, 'nonexistent')).toThrow()
  })

  test('원본 불변성 유지', () => {
    const p = makePlayer([wings])
    removeItem(p, 'wings')
    expect(p.items).toHaveLength(1)
  })
})

describe('applyDiceDestroy', () => {
  test('홀수 저주(value=1): 홀수 주사위 제거', () => {
    // [1, 2, 3, 4, 5] → 홀수 제거 → [2, 4]
    const result = applyDiceDestroy([1, 2, 3, 4, 5], 1)
    expect(result).toEqual([2, 4])
  })

  test('짝수 저주(value=0): 짝수 주사위 제거', () => {
    // [1, 2, 3, 4, 6] → 짝수 제거 → [1, 3]
    const result = applyDiceDestroy([1, 2, 3, 4, 6], 0)
    expect(result).toEqual([1, 3])
  })

  test('모든 주사위가 파괴되면 [0] 반환', () => {
    // [1, 3, 5] → 홀수 저주(parity=1) → 전부 홀수이므로 제거 → [0]
    const result = applyDiceDestroy([1, 3, 5], 1)
    expect(result).toEqual([0])
  })
})

describe('applyMoveFree', () => {
  test('목적지로 이동한다', () => {
    const p = makePlayer()
    const result = applyMoveFree(p, 25, 50)
    expect(result.position).toBe(25)
  })

  test('보드 크기를 초과하면 마지막 타일로 클램핑', () => {
    const p = makePlayer()
    const result = applyMoveFree(p, 99, 50)
    expect(result.position).toBe(49)
  })

  test('음수 목적지는 0으로 클램핑', () => {
    const p = makePlayer()
    const result = applyMoveFree(p, -5, 50)
    expect(result.position).toBe(0)
  })
})

describe('getUsableItems', () => {
  test('before_roll 타이밍에 사용 가능한 아이템만 반환', () => {
    const p = makePlayer([wings, flippers, armageddon])
    const usable = getUsableItems(p, 'before_roll')
    // wings(before_roll) + armageddon(anytime) = 2개
    expect(usable.map(i => i.id)).toContain('wings')
    expect(usable.map(i => i.id)).toContain('armageddon')
    expect(usable.map(i => i.id)).not.toContain('flippers')
  })

  test('빈 인벤토리면 빈 배열 반환', () => {
    const p = makePlayer([])
    expect(getUsableItems(p, 'before_roll')).toEqual([])
  })
})
