/**
 * deck.ts — 덱 편성 저장 / 유효성 검사
 *
 * 유효성 검사 규칙:
 *   1. 3개 캐릭터 모두 user_characters에 존재해야 함
 *   2. attackerId → attacker 포지션 가능한 클래스 (King / Queen / Knight)
 *   3. defenderId → defender 포지션 가능한 클래스 (King / Rook / Pawn)
 *   4. intelligenceId → intelligence 포지션 가능한 클래스 (King / Bishop / Rook)
 *   5. 같은 캐릭터 중복 배치 금지
 */

import type { Character } from '../../../../shared/gameLogic/types'
import { supabase } from '../../lib/supabaseClient'
import { getCharacterById, POSITION_ALLOWED_CLASSES } from './data'

export { POSITION_ALLOWED_CLASSES }

// ── 타입 ─────────────────────────────────────────────────────────

export interface DeckInput {
  attackerId:     string
  defenderId:     string
  intelligenceId: string
}

export interface DeckRecord {
  id:             string
  userId:         string
  attackerId:     string
  defenderId:     string
  intelligenceId: string
  updatedAt:      string
}

// ── 유효성 검사 (순수 함수) ───────────────────────────────────────

/**
 * 덱 편성 유효성 검사
 * @throws 유효하지 않으면 에러 메시지와 함께 throw
 */
export function validateDeckInput(
  input: DeckInput,
  ownedCharacterIds: string[],
): void {
  const { attackerId, defenderId, intelligenceId } = input

  // 1. 중복 캐릭터 검사
  const ids = [attackerId, defenderId, intelligenceId]
  const unique = new Set(ids)
  if (unique.size !== 3) {
    throw new Error('[deck] 같은 캐릭터를 여러 슬롯에 배치할 수 없습니다.')
  }

  // 2. 보유 여부 검사
  for (const id of ids) {
    if (!ownedCharacterIds.includes(id)) {
      throw new Error(`[deck] 보유하지 않은 캐릭터입니다: ${id}`)
    }
  }

  // 3. 포지션 적합성 검사
  const attackerChar = getCharacterById(attackerId)
  const defenderChar = getCharacterById(defenderId)
  const intelChar    = getCharacterById(intelligenceId)

  if (!attackerChar || !defenderChar || !intelChar) {
    throw new Error('[deck] 존재하지 않는 캐릭터 ID가 포함되어 있습니다.')
  }

  const attackerAllowed = POSITION_ALLOWED_CLASSES.attacker as readonly string[]
  const defenderAllowed = POSITION_ALLOWED_CLASSES.defender as readonly string[]
  const intelAllowed    = POSITION_ALLOWED_CLASSES.intelligence as readonly string[]

  if (!attackerAllowed.includes(attackerChar.class)) {
    throw new Error(
      `[deck] ${attackerChar.name}(${attackerChar.class})은 어태커 포지션에 배치할 수 없습니다.` +
      ` 가능한 클래스: ${attackerAllowed.join(', ')}`,
    )
  }

  if (!defenderAllowed.includes(defenderChar.class)) {
    throw new Error(
      `[deck] ${defenderChar.name}(${defenderChar.class})은 디펜더 포지션에 배치할 수 없습니다.` +
      ` 가능한 클래스: ${defenderAllowed.join(', ')}`,
    )
  }

  if (!intelAllowed.includes(intelChar.class)) {
    throw new Error(
      `[deck] ${intelChar.name}(${intelChar.class})은 인텔리전스 포지션에 배치할 수 없습니다.` +
      ` 가능한 클래스: ${intelAllowed.join(', ')}`,
    )
  }
}

// ── DB 연동 함수 ─────────────────────────────────────────────────

/**
 * 사용자의 보유 캐릭터 ID 목록 조회
 */
async function getOwnedCharacterIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_characters')
    .select('character_id')
    .eq('user_id', userId)

  if (error) throw new Error(`[deck] 보유 캐릭터 조회 실패: ${error.message}`)
  return (data ?? []).map(row => row.character_id)
}

/**
 * 덱 저장 (upsert — 사용자당 1개 덱)
 * @param userId - 사용자 ID
 * @param input  - 덱 편성 데이터
 * @returns 저장된 덱 레코드
 */
export async function saveDeck(userId: string, input: DeckInput): Promise<DeckRecord> {
  // 1. 보유 캐릭터 조회
  const ownedIds = await getOwnedCharacterIds(userId)

  // 2. 유효성 검사
  validateDeckInput(input, ownedIds)

  // 3. Upsert (사용자당 1덱)
  const { data, error } = await supabase
    .from('decks')
    .upsert(
      {
        user_id:          userId,
        attacker_id:      input.attackerId,
        defender_id:      input.defenderId,
        intelligence_id:  input.intelligenceId,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) throw new Error(`[deck] 덱 저장 실패: ${error.message}`)

  return {
    id:             data.id,
    userId:         data.user_id,
    attackerId:     data.attacker_id,
    defenderId:     data.defender_id,
    intelligenceId: data.intelligence_id,
    updatedAt:      data.updated_at,
  }
}

/**
 * 현재 저장된 덱 조회
 * @param userId - 사용자 ID
 * @returns 덱 레코드 또는 null (덱 미편성)
 */
export async function getDeck(userId: string): Promise<DeckRecord | null> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null  // No rows found
    throw new Error(`[deck] 덱 조회 실패: ${error.message}`)
  }

  return {
    id:             data.id,
    userId:         data.user_id,
    attackerId:     data.attacker_id,
    defenderId:     data.defender_id,
    intelligenceId: data.intelligence_id,
    updatedAt:      data.updated_at,
  }
}
