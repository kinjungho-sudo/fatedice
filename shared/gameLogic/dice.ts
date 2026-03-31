/**
 * dice.ts — 주사위 이원화 시스템
 *
 * FateDice 핵심 차별점:
 *   mov=1 → 1D6 (1~6 균등분포, 예측 불가, 역전 가능성)
 *   mov=2 → 2D4 (2~8 삼각분포, 평균≈5, 전략적 안정성)
 *
 * 모든 함수는 순수 함수 — 부작용 없음
 */

/**
 * 주사위 이원화 이동 굴리기
 * @param mov - 캐릭터 이동력 (1=1D6, 2=2D4)
 * @returns 이동 칸 수 (1D6: 1~6, 2D4: 2~8)
 */
export function rollMovement(mov: 1 | 2): number {
  if (mov === 1) {
    return rollDice(1, 6)[0]
  }
  // 2D4: 주사위 2개 합산
  return rollDice(2, 4).reduce((sum, v) => sum + v, 0)
}

/**
 * N개의 X면 주사위를 굴린다
 * @param count - 주사위 개수
 * @param faces - 주사위 면 수 (D4=4, D6=6 등)
 * @returns 각 주사위 결과 배열 (1 ~ faces)
 */
export function rollDice(count: number, faces: number): number[] {
  if (count <= 0 || faces <= 0) return []
  const results: number[] = []
  for (let i = 0; i < count; i++) {
    results.push(Math.floor(Math.random() * faces) + 1)
  }
  return results
}

/**
 * 주사위 배열 합산
 * @param rolls - 주사위 결과 배열
 * @returns 합산 값
 */
export function sumDice(rolls: number[]): number {
  return rolls.reduce((sum, v) => sum + v, 0)
}

/**
 * INT 보너스 적용
 * @param sum  - 주사위 합산 값
 * @param int  - 지력 고정 보너스
 * @returns sum + int
 */
export function applyIntBonus(sum: number, int: number): number {
  return sum + int
}

/**
 * 고정값 주사위 생성 (테스트·어빌리티 전용)
 * ATK_FIX / DEF_FIX 어빌리티에서 사용 (Destroy=24, Block=24)
 * @param fixedValue - 고정 값
 * @returns 고정 값을 담은 배열
 */
export function rollFixed(fixedValue: number): number[] {
  return [fixedValue]
}
