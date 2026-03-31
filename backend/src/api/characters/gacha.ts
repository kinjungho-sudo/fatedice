/**
 * gacha.ts — 뽑기(가챠) 시스템
 *
 * 확률 테이블:
 *   Normal:    60%
 *   Rare:      30%
 *   Epic:       9%
 *   Legendary:  1%
 *
 * 천장(Pity) 시스템:
 *   50회 Epic 미등장 → 다음 뽑기에서 Epic 확정
 *   100회 Legendary 미등장 → 다음 뽑기에서 Legendary 확정
 *
 * 비용:
 *   1회  GP 100 / CP 10
 *   10연챠 GP 900 / CP 90 (10% 할인)
 */

import type { Character, CharacterGrade } from '../../../../shared/gameLogic/types'
import { supabase } from '../../lib/supabaseClient'
import { CHARACTER_CATALOG, CHARACTERS_BY_GRADE, getCharacterById } from './data'

// ── 상수 ──────────────────────────────────────────────────────────

export const GACHA_RATES: Record<CharacterGrade, number> = {
  Normal:    0.60,
  Rare:      0.30,
  Epic:      0.09,
  Legendary: 0.01,
}

export const PITY_EPIC      = 50
export const PITY_LEGENDARY = 100

export const GACHA_COST = {
  single_gp: 100,
  single_cp: 10,
  ten_gp:    900,
  ten_cp:    90,
} as const

// ── 순수 함수 (확률 계산) ─────────────────────────────────────────

/**
 * 뽑기 1회 등급 결정
 * pityCount: 현재 Epic 미등장 횟수
 * pityLegendaryCount: 현재 Legendary 미등장 횟수
 */
export function rollGrade(pityCount: number, pityLegendaryCount: number): CharacterGrade {
  // 천장 우선 적용
  if (pityLegendaryCount >= PITY_LEGENDARY) return 'Legendary'
  if (pityCount >= PITY_EPIC)               return 'Epic'

  const rand = Math.random()

  if (rand < GACHA_RATES.Legendary) return 'Legendary'
  if (rand < GACHA_RATES.Legendary + GACHA_RATES.Epic) return 'Epic'
  if (rand < GACHA_RATES.Legendary + GACHA_RATES.Epic + GACHA_RATES.Rare) return 'Rare'
  return 'Normal'
}

/**
 * 해당 등급에서 랜덤 캐릭터 1종 선택
 */
export function pickCharacterByGrade(grade: CharacterGrade): Character {
  const pool = CHARACTERS_BY_GRADE[grade]
  const index = Math.floor(Math.random() * pool.length)
  return pool[index]
}

// ── DB 연동 함수 ──────────────────────────────────────────────────

interface PityInfo {
  pityCount:          number  // Epic 미등장 횟수
  pityLegendaryCount: number  // Legendary 미등장 횟수
}

/**
 * 사용자의 현재 천장 카운트 조회
 */
async function getPityInfo(userId: string): Promise<PityInfo> {
  const { data, error } = await supabase
    .from('gacha_logs')
    .select('grade')
    .eq('user_id', userId)
    .order('pulled_at', { ascending: false })
    .limit(PITY_LEGENDARY)

  if (error) throw new Error(`[gacha] 천장 조회 실패: ${error.message}`)

  const logs: { grade: string }[] = data ?? []

  // Epic 미등장 횟수: 마지막 Epic/Legendary 이후 연속 횟수
  let pityCount = 0
  for (const log of logs) {
    if (log.grade === 'Epic' || log.grade === 'Legendary') break
    pityCount++
  }

  // Legendary 미등장 횟수: 마지막 Legendary 이후 연속 횟수
  let pityLegendaryCount = 0
  for (const log of logs) {
    if (log.grade === 'Legendary') break
    pityLegendaryCount++
  }

  return { pityCount, pityLegendaryCount }
}

/**
 * 뽑기 결과 DB 기록
 */
async function recordGachaLog(
  userId: string,
  characterId: string,
  grade: CharacterGrade,
  costType: 'GP' | 'CP',
  cost: number,
): Promise<void> {
  // 1. 가챠 로그 기록 + user_characters upsert (동시)
  const [logResult, upsertResult] = await Promise.all([
    supabase.from('gacha_logs').insert({
      user_id:      userId,
      character_id: characterId,
      grade,
      cost_type:    costType,
    }),
    supabase.from('user_characters').upsert(
      { user_id: userId, character_id: characterId },
      { onConflict: 'user_id,character_id', ignoreDuplicates: true },
    ),
  ])

  if (logResult.error) throw new Error(`[gacha] 로그 기록 실패: ${logResult.error.message}`)
  if (upsertResult.error) throw new Error(`[gacha] 캐릭터 등록 실패: ${upsertResult.error.message}`)
}

/**
 * 포인트 잔액 확인 후 차감
 * 잔액 부족 시 throw
 */
async function deductPoints(userId: string, costType: 'GP' | 'CP', amount: number): Promise<void> {
  const column = costType === 'GP' ? 'gp' : 'cp'

  // 1. 현재 잔액 조회
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select(column)
    .eq('id', userId)
    .single()

  if (fetchError || !user) {
    throw new Error('[gacha] 사용자를 찾을 수 없습니다.')
  }

  const current = (user as Record<string, number>)[column]
  if (current < amount) {
    throw new Error(`[gacha] ${costType} 포인트가 부족합니다. (보유: ${current}, 필요: ${amount})`)
  }

  // 2. 차감
  const { error: updateError } = await supabase
    .from('users')
    .update({ [column]: current - amount })
    .eq('id', userId)

  if (updateError) {
    throw new Error(`[gacha] 포인트 차감 실패: ${updateError.message}`)
  }
}

// ── 공개 API ─────────────────────────────────────────────────────

/**
 * 1회 뽑기
 * @param userId   - 뽑기를 실행하는 사용자 ID
 * @param costType - 'GP' 또는 'CP'
 * @returns 뽑은 캐릭터
 */
export async function singleGacha(
  userId: string,
  costType: 'GP' | 'CP',
): Promise<Character> {
  const cost = costType === 'GP' ? GACHA_COST.single_gp : GACHA_COST.single_cp

  // 1. 포인트 차감 (실패 시 throw)
  await deductPoints(userId, costType, cost)

  // 2. 천장 조회 → 등급 결정 → 캐릭터 선택
  const { pityCount, pityLegendaryCount } = await getPityInfo(userId)
  const grade     = rollGrade(pityCount, pityLegendaryCount)
  const character = pickCharacterByGrade(grade)

  // 3. 로그 기록 + user_characters 등록
  await recordGachaLog(userId, character.id, grade, costType, cost)

  return character
}

/**
 * 10연챠 뽑기
 * @param userId   - 사용자 ID
 * @param costType - 'GP' 또는 'CP'
 * @returns 뽑은 캐릭터 10종
 */
export async function tenGacha(
  userId: string,
  costType: 'GP' | 'CP',
): Promise<Character[]> {
  const cost = costType === 'GP' ? GACHA_COST.ten_gp : GACHA_COST.ten_cp

  // 1. 포인트 차감 (한 번에)
  await deductPoints(userId, costType, cost)

  // 2. 천장 조회
  const { pityCount, pityLegendaryCount } = await getPityInfo(userId)

  const results: Character[] = []
  let currentPity          = pityCount
  let currentPityLegendary = pityLegendaryCount

  for (let i = 0; i < 10; i++) {
    const grade     = rollGrade(currentPity, currentPityLegendary)
    const character = pickCharacterByGrade(grade)
    results.push(character)

    // 천장 카운트 갱신
    if (grade === 'Legendary') {
      currentPity          = 0
      currentPityLegendary = 0
    } else if (grade === 'Epic') {
      currentPity = 0
      currentPityLegendary++
    } else {
      currentPity++
      currentPityLegendary++
    }
  }

  // 3. 로그 일괄 기록
  await Promise.all(
    results.map(c =>
      recordGachaLog(userId, c.id, c.grade, costType, Math.floor(cost / 10)),
    ),
  )

  return results
}
