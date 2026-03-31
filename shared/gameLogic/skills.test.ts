import {
  chargeAG, chargeTileBonus, applyCursePenalty,
  canActivate, activateAbility, tickAbilityDuration,
  applyAbilityBonus, isAbilityActive,
  AG_PER_TILE, AG_TILE_BONUS, AG_CURSE_PENALTY,
} from './skills'
import type { Player, Ability } from './types'

function makePlayer(ag: number = 0, hasAbility: boolean = false): Player {
  const ability: Ability = {
    id: 'test-ability',
    name: 'Test',
    attribute: 'Sword',
    effectType: 'ATK_BONUS',
    value: 5,
    duration: 3,
  }

  return {
    id: 'P1',
    userId: 'user1',
    nickname: 'Player1',
    party: {
      attacker:     { id: 'a', name: 'A', class: 'Knight', grade: 'Normal', attribute: 'Sword', stats: { mov: 1, atk: 2, def: 1, int: 0, hp: 10 }, abilities: [ability], imageUrl: '' },
      defender:     { id: 'b', name: 'B', class: 'Rook',   grade: 'Normal', attribute: 'Disk',  stats: { mov: 1, atk: 1, def: 3, int: 0, hp: 10 }, abilities: [], imageUrl: '' },
      intelligence: { id: 'c', name: 'C', class: 'Bishop', grade: 'Normal', attribute: 'Wand',  stats: { mov: 1, atk: 0, def: 0, int: 2, hp: 10 }, abilities: [], imageUrl: '' },
    },
    position: 10,
    ag,
    items: [],
    activeAbility: hasAbility
      ? { ability, remainingDuration: 2 }
      : null,
    isConnected: true,
  }
}

describe('chargeAG', () => {
  test('이동 3칸 → AG + 30', () => {
    const p = makePlayer(0)
    expect(chargeAG(p, 3).ag).toBe(30)
  })

  test('AG가 100을 초과하지 않는다', () => {
    const p = makePlayer(90)
    expect(chargeAG(p, 5).ag).toBe(100)  // 90 + 50 → cap at 100
  })

  test('원본 플레이어 불변성 유지', () => {
    const p = makePlayer(50)
    chargeAG(p, 3)
    expect(p.ag).toBe(50)
  })
})

describe('chargeTileBonus', () => {
  test(`ability_charge 타일 → AG +${AG_TILE_BONUS}`, () => {
    const p = makePlayer(40)
    expect(chargeTileBonus(p).ag).toBe(40 + AG_TILE_BONUS)
  })

  test('100 캡 적용', () => {
    const p = makePlayer(90)
    expect(chargeTileBonus(p).ag).toBe(100)
  })
})

describe('applyCursePenalty', () => {
  test(`curse 타일 → AG -${AG_CURSE_PENALTY}`, () => {
    const p = makePlayer(50)
    expect(applyCursePenalty(p).ag).toBe(40)
  })

  test('AG는 0 미만으로 내려가지 않는다', () => {
    const p = makePlayer(5)
    expect(applyCursePenalty(p).ag).toBeGreaterThanOrEqual(0)
  })
})

describe('canActivate', () => {
  test('AG=100 → true', () => {
    expect(canActivate(makePlayer(100))).toBe(true)
  })

  test('AG=99 → false', () => {
    expect(canActivate(makePlayer(99))).toBe(false)
  })

  test('AG=0 → false', () => {
    expect(canActivate(makePlayer(0))).toBe(false)
  })
})

describe('activateAbility', () => {
  const ability: Ability = {
    id: 'ab1', name: 'Destroy', attribute: 'Sword',
    effectType: 'ATK_FIX', value: 24, duration: 2,
  }

  test('AG=100이면 어빌리티 발동, AG=0으로 초기화', () => {
    const p = makePlayer(100)
    const result = activateAbility(p, ability)
    expect(result.ag).toBe(0)
    expect(result.activeAbility?.ability.id).toBe('ab1')
    expect(result.activeAbility?.remainingDuration).toBe(2)
  })

  test('AG<100이면 에러를 던진다', () => {
    const p = makePlayer(80)
    expect(() => activateAbility(p, ability)).toThrow()
  })

  test('원본 플레이어 불변성 유지', () => {
    const p = makePlayer(100)
    activateAbility(p, ability)
    expect(p.ag).toBe(100)
    expect(p.activeAbility).toBeNull()
  })
})

describe('tickAbilityDuration', () => {
  test('remainingDuration 1 감소', () => {
    const p = makePlayer(0, true)  // remainingDuration=2
    const result = tickAbilityDuration(p)
    expect(result.activeAbility?.remainingDuration).toBe(1)
  })

  test('remainingDuration이 0이 되면 activeAbility=null', () => {
    const p = makePlayer(0, true)
    const p1 = tickAbilityDuration(p)    // 2 → 1
    const p2 = tickAbilityDuration(p1)   // 1 → 0 → null
    expect(p2.activeAbility).toBeNull()
  })

  test('activeAbility가 없으면 변화 없음', () => {
    const p = makePlayer(0, false)
    const result = tickAbilityDuration(p)
    expect(result.activeAbility).toBeNull()
    expect(result).toEqual(p)
  })
})

describe('applyAbilityBonus', () => {
  test('ATK_BONUS 어빌리티 활성 시 atk 보너스 적용', () => {
    const p = makePlayer(0, true)  // ATK_BONUS +5
    expect(applyAbilityBonus(p, 'atk', 10)).toBe(15)
  })

  test('어빌리티 없으면 기본값 그대로', () => {
    const p = makePlayer(0, false)
    expect(applyAbilityBonus(p, 'atk', 10)).toBe(10)
  })

  test('타입 불일치 → 보너스 없음 (ATK_BONUS는 def에 적용 안 됨)', () => {
    const p = makePlayer(0, true)  // ATK_BONUS +5
    expect(applyAbilityBonus(p, 'def', 10)).toBe(10)
  })
})

describe('isAbilityActive', () => {
  test('어빌리티 활성 → true', () => {
    expect(isAbilityActive(makePlayer(0, true))).toBe(true)
  })

  test('어빌리티 없음 → false', () => {
    expect(isAbilityActive(makePlayer(0, false))).toBe(false)
  })
})
