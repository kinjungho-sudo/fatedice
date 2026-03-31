import { rollMovement, rollDice, sumDice, applyIntBonus, rollFixed } from './dice'

describe('rollDice', () => {
  test('결과 개수가 count와 일치한다', () => {
    expect(rollDice(3, 6)).toHaveLength(3)
    expect(rollDice(5, 4)).toHaveLength(5)
  })

  test('각 결과가 1 ~ faces 범위 내에 있다', () => {
    for (let i = 0; i < 200; i++) {
      const [val] = rollDice(1, 6)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(6)
    }
    for (let i = 0; i < 200; i++) {
      const [val] = rollDice(1, 4)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(4)
    }
  })

  test('count=0이면 빈 배열을 반환한다', () => {
    expect(rollDice(0, 6)).toEqual([])
  })

  test('faces=0이면 빈 배열을 반환한다', () => {
    expect(rollDice(3, 0)).toEqual([])
  })
})

describe('rollMovement', () => {
  test('mov=1 → 항상 1~6 범위', () => {
    for (let i = 0; i < 1000; i++) {
      const val = rollMovement(1)
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(6)
    }
  })

  test('mov=2 → 항상 2~8 범위 (2D4)', () => {
    for (let i = 0; i < 1000; i++) {
      const val = rollMovement(2)
      expect(val).toBeGreaterThanOrEqual(2)
      expect(val).toBeLessThanOrEqual(8)
    }
  })

  test('mov=2 (2D4) 1000회 평균이 4.5~5.5 범위 (기댓값≈5)', () => {
    let total = 0
    const N = 1000
    for (let i = 0; i < N; i++) {
      total += rollMovement(2)
    }
    const avg = total / N
    expect(avg).toBeGreaterThanOrEqual(4.5)
    expect(avg).toBeLessThanOrEqual(5.5)
  })

  test('mov=1 (1D6) 1000회 평균이 3.0~4.0 범위 (기댓값=3.5)', () => {
    let total = 0
    const N = 1000
    for (let i = 0; i < N; i++) {
      total += rollMovement(1)
    }
    const avg = total / N
    expect(avg).toBeGreaterThanOrEqual(3.0)
    expect(avg).toBeLessThanOrEqual(4.0)
  })
})

describe('sumDice', () => {
  test('[3, 4, 2] 합산 = 9', () => {
    expect(sumDice([3, 4, 2])).toBe(9)
  })

  test('빈 배열 합산 = 0', () => {
    expect(sumDice([])).toBe(0)
  })

  test('[6, 6, 6] 합산 = 18', () => {
    expect(sumDice([6, 6, 6])).toBe(18)
  })
})

describe('applyIntBonus', () => {
  test('10 + 3 = 13', () => {
    expect(applyIntBonus(10, 3)).toBe(13)
  })

  test('int=0이면 변화 없음', () => {
    expect(applyIntBonus(7, 0)).toBe(7)
  })
})

describe('rollFixed', () => {
  test('24 고정값 반환', () => {
    expect(rollFixed(24)).toEqual([24])
  })

  test('sumDice와 조합하면 고정 값이 나온다', () => {
    expect(sumDice(rollFixed(24))).toBe(24)
  })
})
