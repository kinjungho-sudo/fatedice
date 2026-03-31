/**
 * battle.ts — 전투 판정 엔진
 *
 * 전투 흐름:
 *   1. 아이템 선처리 (COPY_DICE, STAT_HALVE)
 *   2. 어빌리티 고정값 처리 (ATK_FIX=Destroy, DEF_FIX=Block)
 *   3. 주사위 롤
 *   4. INT 보너스 가산
 *   5. SWAP_VALUES 아이템 처리
 *   6. 승패 판정
 *   7. ★ 태초 귀환 판정 (diff >= 7)
 *   8. 패배자 위치 계산
 *
 * 모든 함수는 순수 함수 — 부작용 없음
 */

import type { Player, Item, BattleResult } from './types'
import { rollDice, rollFixed, sumDice } from './dice'

/**
 * 전투를 실행하고 결과를 반환한다
 * @param attacker      - 공격자 플레이어
 * @param defender      - 수비자 플레이어
 * @param attackerItem  - 공격자가 사용한 아이템 (optional)
 * @param defenderItem  - 수비자가 사용한 아이템 (optional)
 * @returns BattleResult
 */
export function executeBattle(
  attacker: Player,
  defender: Player,
  attackerItem?: Item,
  defenderItem?: Item
): BattleResult {
  // ── Step 1. 아이템 선처리: 주사위 개수 조정 ──────────────────
  let atkCount = attacker.party.attacker.stats.atk
  let defCount = defender.party.defender.stats.def

  // STAT_HALVE(아마겟돈): 상대 스탯 절반
  if (attackerItem?.effectType === 'STAT_HALVE') {
    defCount = Math.max(1, Math.floor(defCount / 2))
  }
  if (defenderItem?.effectType === 'STAT_HALVE') {
    atkCount = Math.max(1, Math.floor(atkCount / 2))
  }

  // COPY_DICE(발키리의 창): 공격자가 방어 주사위의 절반을 추가
  if (attackerItem?.effectType === 'COPY_DICE') {
    atkCount += Math.floor(defCount / 2)
  }

  // ── Step 2. 어빌리티 고정값 처리 ─────────────────────────────
  const atkAbility = attacker.activeAbility?.ability
  const defAbility = defender.activeAbility?.ability

  let atkRolls: number[]
  let defRolls: number[]

  if (atkAbility?.effectType === 'ATK_FIX') {
    // Destroy: 공격 24 고정
    atkRolls = rollFixed(atkAbility.value)
  } else {
    atkRolls = rollDice(atkCount, 6)
  }

  if (defAbility?.effectType === 'DEF_FIX') {
    // Block: 방어 24 고정
    defRolls = rollFixed(defAbility.value)
  } else {
    defRolls = rollDice(defCount, 6)
  }

  // ── Step 3. INT 보너스 가산 ───────────────────────────────────
  const atkInt = attacker.party.intelligence.stats.int
  const defInt = defender.party.intelligence.stats.int

  let atkTotal = sumDice(atkRolls) + atkInt
  let defTotal = sumDice(defRolls) + defInt

  // ── Step 4. BATTLE_NULLIFY(오리발): 전투 무효화 → 무승부 ─────
  if (
    attackerItem?.effectType === 'BATTLE_NULLIFY' ||
    defenderItem?.effectType === 'BATTLE_NULLIFY'
  ) {
    return buildResult({
      attackerId: attacker.id,
      defenderId: defender.id,
      atkRolls,
      defRolls,
      atkTotal,
      defTotal: atkTotal, // 강제 무승부
      attackerPos: attacker.position,
      defenderPos: defender.position,
      isMutualGenesis: false,
    })
  }

  // ── Step 5. MUTUAL_GENESIS(자폭): 양측 태초 귀환 ────────────
  if (
    attackerItem?.effectType === 'MUTUAL_GENESIS' ||
    defenderItem?.effectType === 'MUTUAL_GENESIS'
  ) {
    return {
      attackerId:      attacker.id,
      defenderId:      defender.id,
      atkRolls,
      defRolls,
      atkTotal,
      defTotal,
      diff:            0,
      winner:          'draw',
      isGenesisReturn: true,
      loserNewPos:     0, // 양측 다 0으로 — 소켓에서 양쪽 처리
    }
  }

  // ── Step 6. SWAP_VALUES(체인지): 공격/방어 합산 값 교환 ──────
  if (attackerItem?.effectType === 'SWAP_VALUES' || defenderItem?.effectType === 'SWAP_VALUES') {
    ;[atkTotal, defTotal] = [defTotal, atkTotal]
  }

  // ── Step 7. 승패 판정 + 태초 귀환 ───────────────────────────
  return buildResult({
    attackerId:   attacker.id,
    defenderId:   defender.id,
    atkRolls,
    defRolls,
    atkTotal,
    defTotal,
    attackerPos:  attacker.position,
    defenderPos:  defender.position,
    isMutualGenesis: false,
  })
}

// ── 내부 헬퍼 ───────────────────────────────────────────────────

interface BuildResultParams {
  attackerId:      string
  defenderId:      string
  atkRolls:        number[]
  defRolls:        number[]
  atkTotal:        number
  defTotal:        number
  attackerPos:     number
  defenderPos:     number
  isMutualGenesis: boolean
}

function buildResult(p: BuildResultParams): BattleResult {
  const diff = Math.abs(p.atkTotal - p.defTotal)

  let winner: BattleResult['winner']
  if (p.atkTotal > p.defTotal) winner = 'attacker'
  else if (p.defTotal > p.atkTotal) winner = 'defender'
  else winner = 'draw'

  // ★ 태초 귀환: diff >= 7 → 패배자는 타일 0으로
  const isGenesisReturn = diff >= 7

  let loserNewPos: number
  if (winner === 'draw') {
    // 무승부: 패배자 없음 → 이동 없음 (공격자 위치 기준)
    loserNewPos = p.attackerPos
  } else if (winner === 'attacker') {
    // 수비자 패배
    loserNewPos = isGenesisReturn ? 0 : Math.max(0, p.defenderPos - diff)
  } else {
    // 공격자 패배
    loserNewPos = isGenesisReturn ? 0 : Math.max(0, p.attackerPos - diff)
  }

  return {
    attackerId:      p.attackerId,
    defenderId:      p.defenderId,
    atkRolls:        p.atkRolls,
    defRolls:        p.defRolls,
    atkTotal:        p.atkTotal,
    defTotal:        p.defTotal,
    diff,
    winner,
    isGenesisReturn,
    loserNewPos,
  }
}

/**
 * 전투 결과에서 패배자 플레이어 ID를 반환
 * draw이면 null
 */
export function getBattleLoser(result: BattleResult): string | null {
  if (result.winner === 'draw') return null
  return result.winner === 'attacker' ? result.defenderId : result.attackerId
}

/**
 * 전투 결과에서 승리자 플레이어 ID를 반환
 * draw이면 null
 */
export function getBattleWinner(result: BattleResult): string | null {
  if (result.winner === 'draw') return null
  return result.winner === 'attacker' ? result.attackerId : result.defenderId
}
