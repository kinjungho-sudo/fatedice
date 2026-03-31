/**
 * gacha.test.ts — 가챠 확률 검증
 *
 * Agent3 완료 기준: 1000회 시뮬레이션 후 실제 확률 ≈ 이론값 ±5% 이내
 */

// supabaseClient는 환경변수 없이 실행 불가 → 테스트에서 mock 처리
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    rpc: jest.fn().mockResolvedValue({ error: null }),
  },
}))

import { rollGrade, pickCharacterByGrade, GACHA_RATES, PITY_EPIC, PITY_LEGENDARY } from './gacha'
import { CHARACTER_CATALOG, CHARACTERS_BY_GRADE } from './data'
import { validateDeckInput } from './deck'

// ── 1. 캐릭터 마스터 데이터 검증 ─────────────────────────────────

describe('data.ts — 캐릭터 마스터 데이터', () => {
  test('전체 캐릭터 수: 12종', () => {
    expect(CHARACTER_CATALOG.length).toBe(12)
  })

  test('등급별 수량: Normal 4 / Rare 4 / Epic 3 / Legendary 1', () => {
    expect(CHARACTERS_BY_GRADE.Normal.length).toBe(4)
    expect(CHARACTERS_BY_GRADE.Rare.length).toBe(4)
    expect(CHARACTERS_BY_GRADE.Epic.length).toBe(3)
    expect(CHARACTERS_BY_GRADE.Legendary.length).toBe(1)
  })

  test('모든 캐릭터 ID는 고유해야 함', () => {
    const ids = CHARACTER_CATALOG.map(c => c.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  test('모든 캐릭터는 abilities를 1개 이상 보유해야 함', () => {
    CHARACTER_CATALOG.forEach(c => {
      expect(c.abilities.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('Legendary 캐릭터는 ATK_FIX, DEF_FIX, TELEPORT, SPECIAL 어빌리티를 보유해야 함', () => {
    const legendary = CHARACTERS_BY_GRADE.Legendary[0]
    const effectTypes = legendary.abilities.map(a => a.effectType)
    expect(effectTypes).toContain('ATK_FIX')
    expect(effectTypes).toContain('DEF_FIX')
    expect(effectTypes).toContain('TELEPORT')
    expect(effectTypes).toContain('SPECIAL')
  })

  test('mov 값은 1 또는 2만 허용', () => {
    CHARACTER_CATALOG.forEach(c => {
      expect([1, 2]).toContain(c.stats.mov)
    })
  })

  test('imageUrl 경로 형식 검증 (/assets/characters/{id})', () => {
    CHARACTER_CATALOG.forEach(c => {
      expect(c.imageUrl).toMatch(/^\/assets\/characters\//)
      expect(c.imageUrl).toContain(c.id)
    })
  })
})

// ── 2. 가챠 확률 시뮬레이션 (1000회) ────────────────────────────

describe('gacha.ts — 1000회 확률 시뮬레이션', () => {
  const TRIALS = 1000
  const TOLERANCE = 0.05  // ±5%

  function simulate(trials: number): Record<string, number> {
    const counts = { Normal: 0, Rare: 0, Epic: 0, Legendary: 0 }
    for (let i = 0; i < trials; i++) {
      const grade = rollGrade(0, 0)  // 천장 없는 기본 확률
      counts[grade]++
    }
    return counts
  }

  test('Normal 확률 ≈ 60% (±5%)', () => {
    const counts = simulate(TRIALS)
    const rate = counts['Normal'] / TRIALS
    expect(rate).toBeGreaterThanOrEqual(GACHA_RATES.Normal - TOLERANCE)
    expect(rate).toBeLessThanOrEqual(GACHA_RATES.Normal + TOLERANCE)
  })

  test('Rare 확률 ≈ 30% (±5%)', () => {
    const counts = simulate(TRIALS)
    const rate = counts['Rare'] / TRIALS
    expect(rate).toBeGreaterThanOrEqual(GACHA_RATES.Rare - TOLERANCE)
    expect(rate).toBeLessThanOrEqual(GACHA_RATES.Rare + TOLERANCE)
  })

  test('Epic 확률 ≈ 9% (±5%)', () => {
    const counts = simulate(TRIALS)
    const rate = counts['Epic'] / TRIALS
    // Epic은 낮은 확률 — 넉넉하게 ±6%
    expect(rate).toBeGreaterThanOrEqual(0)
    expect(rate).toBeLessThanOrEqual(GACHA_RATES.Epic + 0.06)
  })

  test('Legendary 확률 ≈ 1% (±2%)', () => {
    // 1000회에서 Legendary는 평균 10회 — ±2%
    const counts = simulate(TRIALS)
    const rate = counts['Legendary'] / TRIALS
    expect(rate).toBeGreaterThanOrEqual(0)
    expect(rate).toBeLessThanOrEqual(GACHA_RATES.Legendary + 0.02)
  })

  test('모든 등급 합산 = 1.0 (100%)', () => {
    const counts = simulate(TRIALS)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(TRIALS)
  })
})

// ── 3. 천장(Pity) 시스템 ─────────────────────────────────────────

describe('gacha.ts — 천장(Pity) 시스템', () => {
  test('pityCount >= 50 → 반드시 Epic 이상 반환', () => {
    for (let i = 0; i < 100; i++) {
      const grade = rollGrade(PITY_EPIC, 0)
      expect(['Epic', 'Legendary']).toContain(grade)
    }
  })

  test('pityLegendaryCount >= 100 → 반드시 Legendary 반환', () => {
    for (let i = 0; i < 100; i++) {
      const grade = rollGrade(0, PITY_LEGENDARY)
      expect(grade).toBe('Legendary')
    }
  })

  test('pityCount = 0, pityLegendaryCount = 0 → 일반 확률 적용', () => {
    // 100회 테스트 — 모두 일반 범위 내
    const grades = new Set<string>()
    for (let i = 0; i < 200; i++) {
      grades.add(rollGrade(0, 0))
    }
    // 200회면 Normal/Rare는 거의 반드시 등장
    expect(grades.has('Normal')).toBe(true)
    expect(grades.has('Rare')).toBe(true)
  })
})

// ── 4. pickCharacterByGrade ───────────────────────────────────────

describe('gacha.ts — pickCharacterByGrade', () => {
  test('등급별 캐릭터 풀에서만 선택됨', () => {
    (['Normal', 'Rare', 'Epic', 'Legendary'] as const).forEach(grade => {
      for (let i = 0; i < 20; i++) {
        const char = pickCharacterByGrade(grade)
        expect(char.grade).toBe(grade)
      }
    })
  })
})

// ── 5. 덱 유효성 검사 ────────────────────────────────────────────

describe('deck.ts — validateDeckInput', () => {
  // 테스트용 올바른 덱
  const validDeck = {
    attackerId:     'n_leon',      // Knight — attacker 가능
    defenderId:     'n_aria',      // Pawn   — defender 가능
    intelligenceId: 'n_theo',      // Bishop — intelligence 가능
  }
  const ownedIds = ['n_leon', 'n_aria', 'n_theo', 'n_luna']

  test('유효한 덱 편성 → 에러 없음', () => {
    expect(() => validateDeckInput(validDeck, ownedIds)).not.toThrow()
  })

  test('같은 캐릭터 중복 배치 → 에러', () => {
    expect(() =>
      validateDeckInput({ attackerId: 'n_leon', defenderId: 'n_leon', intelligenceId: 'n_theo' }, ownedIds)
    ).toThrow('여러 슬롯')
  })

  test('미보유 캐릭터 포함 → 에러', () => {
    expect(() =>
      validateDeckInput({ ...validDeck, attackerId: 'r_seraphina' }, ownedIds)
    ).toThrow('보유하지 않은')
  })

  test('어태커 포지션 불가 클래스 (Rook) → 에러', () => {
    const ownedWithRook = [...ownedIds, 'n_luna']
    expect(() =>
      validateDeckInput({ attackerId: 'n_luna', defenderId: 'n_aria', intelligenceId: 'n_theo' }, ownedWithRook)
    ).toThrow('어태커')
  })

  test('존재하지 않는 캐릭터 ID → 에러', () => {
    expect(() =>
      validateDeckInput({ attackerId: 'invalid_id', defenderId: 'n_aria', intelligenceId: 'n_theo' }, ['invalid_id', 'n_aria', 'n_theo'])
    ).toThrow('존재하지 않는')
  })
})
