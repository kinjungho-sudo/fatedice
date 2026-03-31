import { executeBattle, getBattleLoser, getBattleWinner } from './battle'
import type { Player, Item } from './types'

// ── 테스트용 플레이어 팩토리 ──────────────────────────────────────
function makePlayer(
  id: string,
  overrides: {
    atk?: number
    def?: number
    int?: number
    position?: number
    atkFix?: number
    defFix?: number
  } = {}
): Player {
  const {
    atk = 2, def = 2, int = 0,
    position = 10,
    atkFix, defFix,
  } = overrides

  return {
    id,
    userId: `user-${id}`,
    nickname: id,
    party: {
      attacker: {
        id: `char-atk-${id}`,
        name: 'Attacker',
        class: 'Knight',
        grade: 'Normal',
        attribute: 'Sword',
        stats: { mov: 1, atk, def: 1, int: 0, hp: 10 },
        abilities: atkFix
          ? [{
              id: 'destroy',
              name: 'Destroy',
              attribute: 'Sword',
              effectType: 'ATK_FIX',
              value: atkFix,
              duration: 2,
            }]
          : [],
        imageUrl: '',
      },
      defender: {
        id: `char-def-${id}`,
        name: 'Defender',
        class: 'Rook',
        grade: 'Normal',
        attribute: 'Disk',
        stats: { mov: 1, atk: 1, def, int: 0, hp: 10 },
        abilities: defFix
          ? [{
              id: 'block',
              name: 'Block',
              attribute: 'Disk',
              effectType: 'DEF_FIX',
              value: defFix,
              duration: 2,
            }]
          : [],
        imageUrl: '',
      },
      intelligence: {
        id: `char-int-${id}`,
        name: 'Intel',
        class: 'Bishop',
        grade: 'Normal',
        attribute: 'Wand',
        stats: { mov: 1, atk: 0, def: 0, int, hp: 10 },
        abilities: [],
        imageUrl: '',
      },
    },
    position,
    ag: 0,
    items: [],
    activeAbility: null,
    isConnected: true,
  }
}

function makeItem(effectType: Item['effectType']): Item {
  return { id: effectType, name: effectType, effectType, value: null, useTiming: 'during_battle' }
}

// ── 기본 전투 ─────────────────────────────────────────────────────
describe('executeBattle — 기본 전투', () => {
  test('반환 타입이 올바르다', () => {
    const a = makePlayer('A')
    const d = makePlayer('D')
    const result = executeBattle(a, d)

    expect(result.attackerId).toBe('A')
    expect(result.defenderId).toBe('D')
    expect(result.atkRolls.length).toBeGreaterThan(0)
    expect(result.defRolls.length).toBeGreaterThan(0)
    expect(['attacker', 'defender', 'draw']).toContain(result.winner)
    expect(typeof result.isGenesisReturn).toBe('boolean')
    expect(result.loserNewPos).toBeGreaterThanOrEqual(0)
  })

  test('승자가 높은 total을 가진다', () => {
    // INT 보너스로 공격자가 반드시 이기는 시나리오
    const a = makePlayer('A', { atk: 1, int: 100 }) // INT 100 → 항상 승
    const d = makePlayer('D', { def: 1, int: 0 })
    const result = executeBattle(a, d)
    expect(result.winner).toBe('attacker')
  })

  test('수비자 INT 보너스가 높으면 수비자가 이긴다', () => {
    const a = makePlayer('A', { atk: 1, int: 0 })
    const d = makePlayer('D', { def: 1, int: 100 })
    const result = executeBattle(a, d)
    expect(result.winner).toBe('defender')
  })
})

// ── ★ 태초 귀환 (핵심 규칙) ──────────────────────────────────────
describe('태초 귀환 판정 (diff >= 7)', () => {
  test('diff=7이면 isGenesisReturn=true, loserNewPos=0', () => {
    // 공격자 INT 100으로 확실히 7+ 차이 만들기
    const a = makePlayer('A', { atk: 1, int: 100, position: 20 })
    const d = makePlayer('D', { def: 1, int: 0, position: 15 })
    const result = executeBattle(a, d)

    // diff는 최소 100+1 - (1*6+0) > 7 이상
    expect(result.isGenesisReturn).toBe(true)
    expect(result.loserNewPos).toBe(0)
  })

  test('diff=6이면 isGenesisReturn=false', () => {
    // diff를 정확히 6으로 만들기 위해 rollFixed 로직 검증
    // ATK_FIX=10, DEF_FIX=4 → atkTotal=10, defTotal=4, diff=6
    const a = makePlayer('A', { position: 20, atkFix: 10 })
    const d = makePlayer('D', { position: 15, defFix: 4 })

    // 어빌리티 활성화
    a.activeAbility = {
      ability: a.party.attacker.abilities[0],
      remainingDuration: 2,
    }
    d.activeAbility = {
      ability: d.party.defender.abilities[0],
      remainingDuration: 2,
    }

    const result = executeBattle(a, d)
    expect(result.diff).toBe(6)
    expect(result.isGenesisReturn).toBe(false)
  })

  test('Destroy(24) vs Block(24) → diff=0, draw', () => {
    const a = makePlayer('A', { position: 10, atkFix: 24 })
    const d = makePlayer('D', { position: 15, defFix: 24 })

    a.activeAbility = { ability: a.party.attacker.abilities[0], remainingDuration: 2 }
    d.activeAbility = { ability: d.party.defender.abilities[0], remainingDuration: 2 }

    const result = executeBattle(a, d)
    expect(result.atkTotal).toBe(24)
    expect(result.defTotal).toBe(24)
    expect(result.diff).toBe(0)
    expect(result.winner).toBe('draw')
    expect(result.isGenesisReturn).toBe(false)
  })

  test('패배자 위치가 diff만큼 뒤로 이동 (태초 귀환 아닐 때)', () => {
    // ATK_FIX=8, DEF_FIX=4 → diff=4, defenderPos=15 → 15-4=11
    const a = makePlayer('A', { position: 20, atkFix: 8 })
    const d = makePlayer('D', { position: 15, defFix: 4 })

    a.activeAbility = { ability: a.party.attacker.abilities[0], remainingDuration: 2 }
    d.activeAbility = { ability: d.party.defender.abilities[0], remainingDuration: 2 }

    const result = executeBattle(a, d)
    expect(result.diff).toBe(4)
    expect(result.isGenesisReturn).toBe(false)
    expect(result.loserNewPos).toBe(11) // 15 - 4 = 11
  })

  test('loserNewPos는 최솟값 0 (음수 방지)', () => {
    const a = makePlayer('A', { position: 3, atkFix: 24 })
    const d = makePlayer('D', { position: 2, defFix: 1 })

    a.activeAbility = { ability: a.party.attacker.abilities[0], remainingDuration: 2 }
    d.activeAbility = { ability: d.party.defender.abilities[0], remainingDuration: 2 }

    const result = executeBattle(a, d)
    expect(result.loserNewPos).toBeGreaterThanOrEqual(0)
  })
})

// ── 아이템 처리 ──────────────────────────────────────────────────
describe('아이템 처리', () => {
  test('BATTLE_NULLIFY(오리발): 무승부 강제', () => {
    const a = makePlayer('A', { atk: 1, int: 100 }) // 압도적 공격
    const d = makePlayer('D')
    const result = executeBattle(a, d, makeItem('BATTLE_NULLIFY'))
    expect(result.winner).toBe('draw')
    expect(result.isGenesisReturn).toBe(false)
  })

  test('MUTUAL_GENESIS(자폭): winner=draw, isGenesisReturn=true, loserNewPos=0', () => {
    const a = makePlayer('A')
    const d = makePlayer('D')
    const result = executeBattle(a, d, makeItem('MUTUAL_GENESIS'))
    expect(result.winner).toBe('draw')
    expect(result.isGenesisReturn).toBe(true)
    expect(result.loserNewPos).toBe(0)
  })

  test('COPY_DICE(발키리의 창): 공격자 주사위 수 증가', () => {
    // 방어 주사위 4개 → 발키리 창으로 2개 추가 → 공격 주사위 = 원래 + 2
    const a = makePlayer('A', { atk: 2 })
    const d = makePlayer('D', { def: 4 })
    const result = executeBattle(a, d, makeItem('COPY_DICE'))
    // 공격자 주사위 = 2 + floor(4/2) = 4개
    expect(result.atkRolls).toHaveLength(4)
  })

  test('STAT_HALVE(아마겟돈): 방어 주사위 절반', () => {
    const a = makePlayer('A', { atk: 2 })
    const d = makePlayer('D', { def: 4 })
    const result = executeBattle(a, d, makeItem('STAT_HALVE'))
    // 방어 주사위 = floor(4/2) = 2개
    expect(result.defRolls).toHaveLength(2)
  })

  test('SWAP_VALUES(체인지): 공격/방어 합산 교환', () => {
    // ATK_FIX=3, DEF_FIX=10 → 체인지 후 atkTotal=10, defTotal=3
    const a = makePlayer('A', { atkFix: 3 })
    const d = makePlayer('D', { defFix: 10 })
    a.activeAbility = { ability: a.party.attacker.abilities[0], remainingDuration: 2 }
    d.activeAbility = { ability: d.party.defender.abilities[0], remainingDuration: 2 }

    const result = executeBattle(a, d, makeItem('SWAP_VALUES'))
    // 교환 후 공격자(원래 3)가 방어자(원래 10)로 바뀌므로 수비자 유리
    expect(result.atkTotal).toBe(10)
    expect(result.defTotal).toBe(3)
    expect(result.winner).toBe('attacker') // 교환 후 atkTotal=10 > defTotal=3
  })
})

// ── 헬퍼 함수 ────────────────────────────────────────────────────
describe('getBattleLoser / getBattleWinner', () => {
  test('draw이면 null 반환', () => {
    const a = makePlayer('A', { atkFix: 5 })
    const d = makePlayer('D', { defFix: 5 })
    a.activeAbility = { ability: a.party.attacker.abilities[0], remainingDuration: 2 }
    d.activeAbility = { ability: d.party.defender.abilities[0], remainingDuration: 2 }

    const result = executeBattle(a, d)
    expect(getBattleLoser(result)).toBeNull()
    expect(getBattleWinner(result)).toBeNull()
  })

  test('공격자 승리 시 winnerID=A, loserID=D', () => {
    const a = makePlayer('A', { atk: 1, int: 100 })
    const d = makePlayer('D', { def: 1, int: 0 })
    const result = executeBattle(a, d)
    expect(getBattleWinner(result)).toBe('A')
    expect(getBattleLoser(result)).toBe('D')
  })
})
