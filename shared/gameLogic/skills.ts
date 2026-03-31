/**
 * skills.ts — 어빌리티 게이지(AG) 시스템
 *
 * AG 규칙:
 *   - AG 범위: 0 ~ 100
 *   - 이동한 칸 수 * AG_PER_TILE 만큼 충전
 *   - AG >= 100 → 어빌리티 발동 가능
 *   - 어빌리티 발동 후 AG = 0으로 초기화
 *   - 어빌리티 지속: duration 턴, 매 턴 종료 시 1 감소
 *   - ability_charge 타일 착지 시 추가 충전
 *   - curse 타일 착지 시 AG 감소
 *
 * 모든 함수는 순수 함수 — 부작용 없음
 */

import type { Player, Ability, ActiveAbility } from './types'

/** 이동 1칸당 AG 충전량 */
export const AG_PER_TILE = 10

/** ability_charge 타일 보너스 */
export const AG_TILE_BONUS = 30

/** curse 타일 AG 패널티 */
export const AG_CURSE_PENALTY = 10

/**
 * 이동에 따른 AG 충전
 * @param player      - 현재 플레이어 상태
 * @param movedTiles  - 이동한 칸 수
 * @returns AG가 충전된 새 플레이어 (불변)
 */
export function chargeAG(player: Player, movedTiles: number): Player {
  const newAG = Math.min(100, player.ag + movedTiles * AG_PER_TILE)
  return { ...player, ag: newAG }
}

/**
 * ability_charge 타일 착지 시 보너스 AG 충전
 */
export function chargeTileBonus(player: Player): Player {
  const newAG = Math.min(100, player.ag + AG_TILE_BONUS)
  return { ...player, ag: newAG }
}

/**
 * curse 타일 착지 시 AG 감소
 */
export function applyCursePenalty(player: Player): Player {
  const newAG = Math.max(0, player.ag - AG_CURSE_PENALTY)
  return { ...player, ag: newAG }
}

/**
 * 어빌리티 발동 가능 여부
 * @param player - 플레이어 상태
 * @returns AG >= 100이면 true
 */
export function canActivate(player: Player): boolean {
  return player.ag >= 100
}

/**
 * 어빌리티 발동
 * - AG = 0으로 초기화
 * - activeAbility 설정
 * @param player    - 현재 플레이어
 * @param ability   - 발동할 어빌리티
 * @returns 어빌리티가 활성화된 새 플레이어 (불변)
 * @throws AG가 100 미만이면 에러
 */
export function activateAbility(player: Player, ability: Ability): Player {
  if (!canActivate(player)) {
    throw new Error(`[skills] AG 부족 — 발동 불가 (현재 AG: ${player.ag})`)
  }

  const activeAbility: ActiveAbility = {
    ability,
    remainingDuration: ability.duration,
  }

  return {
    ...player,
    ag: 0,
    activeAbility,
  }
}

/**
 * 턴 종료 시 어빌리티 지속 시간 감소
 * - remainingDuration - 1
 * - 0이 되면 activeAbility = null (어빌리티 만료)
 * @param player - 현재 플레이어
 * @returns 업데이트된 플레이어 (불변)
 */
export function tickAbilityDuration(player: Player): Player {
  if (!player.activeAbility) return player

  const nextDuration = player.activeAbility.remainingDuration - 1

  if (nextDuration <= 0) {
    return { ...player, activeAbility: null }
  }

  return {
    ...player,
    activeAbility: {
      ...player.activeAbility,
      remainingDuration: nextDuration,
    },
  }
}

/**
 * 어빌리티 효과를 전투/이동 컨텍스트에 적용
 * ATK_BONUS, DEF_BONUS, INT_BONUS, MOV_BONUS 등 보너스 타입 처리
 *
 * @param player      - 현재 플레이어
 * @param contextType - 'atk' | 'def' | 'int' | 'mov'
 * @param baseValue   - 기본 값
 * @returns 어빌리티 보너스가 적용된 최종 값
 */
export function applyAbilityBonus(
  player: Player,
  contextType: 'atk' | 'def' | 'int' | 'mov',
  baseValue: number
): number {
  if (!player.activeAbility) return baseValue

  const { effectType, value } = player.activeAbility.ability

  switch (contextType) {
    case 'atk':
      if (effectType === 'ATK_BONUS') return baseValue + value
      break
    case 'def':
      if (effectType === 'DEF_BONUS') return baseValue + value
      break
    case 'int':
      if (effectType === 'INT_BONUS') return baseValue + value
      break
    case 'mov':
      if (effectType === 'MOV_BONUS') return baseValue + value
      break
  }

  return baseValue
}

/**
 * 어빌리티가 현재 활성 상태인지 확인
 */
export function isAbilityActive(player: Player): boolean {
  return player.activeAbility !== null && player.activeAbility.remainingDuration > 0
}
