/**
 * board.ts — 보드 엔진
 *
 * 보드 규칙:
 *   - 총 50타일 (index 0~49, 0=시작, 49=골)
 *   - 이동 중 워프 타일 착지 → 즉시 워프 목적지로 이동
 *   - DOA 타일 착지 → 태초 귀환 (position = 0)
 *   - Goal(49) 착지 → 게임 종료
 *   - 이동 중 상대 플레이어와 같은 타일 → 전투 발생
 *
 * 모든 함수는 순수 함수 — 부작용 없음
 */

import type { Player, BoardState, Tile, TileType, TileEvent, MoveResult } from './types'

/** 표준 보드 사이즈 */
export const BOARD_SIZE = 50

/**
 * 표준 50타일 보드 초기화
 * 타일 배치는 스펙 기반 고정 레이아웃
 */
export function initBoard(size: number = BOARD_SIZE): BoardState {
  const tiles: Tile[] = []

  for (let i = 0; i < size; i++) {
    tiles.push(buildTile(i, size))
  }

  return { tiles, totalTiles: size }
}

/**
 * 플레이어를 steps 칸 이동시킨다
 * 워프 타일에 착지하면 즉시 워프 목적지로 이동
 * 이동 경로(path)는 애니메이션에 활용
 *
 * @param player - 현재 플레이어
 * @param board  - 보드 상태
 * @param steps  - 이동 칸 수
 * @returns 이동 후 플레이어 + 경로 + 타일 이벤트
 */
export function movePlayer(
  player: Player,
  board: BoardState,
  steps: number
): MoveResult {
  const path: number[] = []
  let pos = player.position

  // 한 칸씩 이동 (경로 추적)
  for (let i = 0; i < steps; i++) {
    pos = Math.min(pos + 1, board.totalTiles - 1)
    path.push(pos)

    // 골에 도달하면 즉시 멈춤
    if (board.tiles[pos]?.type === 'goal') break
  }

  // 최종 착지 타일 이벤트 계산
  const finalTile = board.tiles[pos]
  let finalPos = pos
  let tileEvent: TileEvent | null = null

  if (finalTile) {
    const eventResult = processTileEvent(player, finalTile)
    finalPos = eventResult.newPos
    tileEvent = eventResult.event

    // 워프 이동 시 path에 워프 목적지 추가
    if (finalTile.type.startsWith('warp_') && finalTile.warpTarget !== null) {
      path.push(finalTile.warpTarget)
    }
  }

  const updatedPlayer: Player = { ...player, position: finalPos }

  return { player: updatedPlayer, path, tileEvent }
}

/**
 * 특정 위치의 타일 이벤트를 반환
 */
export function getTileEvent(
  board: BoardState,
  position: number
): { type: TileType; data: TileEvent['data'] } {
  const tile = board.tiles[position]
  if (!tile) return { type: 'normal', data: {} }

  switch (tile.type) {
    case 'warp_green':
    case 'warp_yellow':
    case 'warp_blue':
      return { type: tile.type, data: { warpTarget: tile.warpTarget ?? undefined } }
    case 'doa':
      return { type: 'doa', data: { message: '즉사 타일 — 태초 귀환' } }
    case 'ability_charge':
      return { type: 'ability_charge', data: { agChange: 30, message: 'AG +30 충전' } }
    case 'blessing':
      return { type: 'blessing', data: { agChange: 20, message: '축복 — AG +20' } }
    case 'curse':
      return { type: 'curse', data: { agChange: -10, message: '저주 — AG -10' } }
    case 'goal':
      return { type: 'goal', data: { message: '골 도달!' } }
    default:
      return { type: 'normal', data: {} }
  }
}

/**
 * 해당 위치에 다른 플레이어가 있는지 확인 (충돌 감지)
 * @param players   - 전체 플레이어 배열
 * @param position  - 착지할 타일 위치
 * @param excludeId - 검사에서 제외할 플레이어 ID (자기 자신)
 * @returns 충돌한 플레이어 or null
 */
export function checkCollision(
  players: Player[],
  position: number,
  excludeId: string
): Player | null {
  return players.find(p => p.id !== excludeId && p.position === position) ?? null
}

/**
 * DOA 타일 효과 적용 — 해당 플레이어를 position 0으로 리셋
 */
export function applyDOA(player: Player): Player {
  return { ...player, position: 0 }
}

/**
 * 골 도달 여부 확인
 */
export function isGoal(player: Player, board: BoardState): boolean {
  return player.position >= board.totalTiles - 1
}

/**
 * 특정 타일 인덱스의 타일 정보 반환
 */
export function getTile(board: BoardState, index: number): Tile | null {
  return board.tiles[index] ?? null
}

// ── 내부 헬퍼 ────────────────────────────────────────────────────

interface TileEventResult {
  newPos: number
  event:  TileEvent | null
}

function processTileEvent(player: Player, tile: Tile): TileEventResult {
  switch (tile.type) {
    case 'warp_green':
    case 'warp_yellow':
    case 'warp_blue': {
      const target = tile.warpTarget ?? tile.index
      return {
        newPos: target,
        event: {
          type:     tile.type,
          playerId: player.id,
          data:     { warpTarget: target, message: `워프 → ${target}번 타일` },
        },
      }
    }

    case 'doa':
      return {
        newPos: 0,
        event: {
          type:     'doa',
          playerId: player.id,
          data:     { message: '즉사 타일 — 태초 귀환' },
        },
      }

    case 'ability_charge':
      return {
        newPos: tile.index,
        event: {
          type:     'ability_charge',
          playerId: player.id,
          data:     { agChange: 30, message: 'AG +30 충전' },
        },
      }

    case 'blessing':
      return {
        newPos: tile.index,
        event: {
          type:     'blessing',
          playerId: player.id,
          data:     { agChange: 20, message: '축복 — AG +20' },
        },
      }

    case 'curse':
      return {
        newPos: tile.index,
        event: {
          type:     'curse',
          playerId: player.id,
          data:     { agChange: -10, message: '저주 — AG -10' },
        },
      }

    case 'goal':
      return {
        newPos: tile.index,
        event: {
          type:     'goal',
          playerId: player.id,
          data:     { message: '골 도달!' },
        },
      }

    default:
      return { newPos: tile.index, event: null }
  }
}

/**
 * 타일 레이아웃 빌더 (스펙 기반 고정 배치)
 *
 * 배치 규칙:
 *   - 0  : 시작 (normal)
 *   - 49 : 골
 *   - 5, 15, 25 : ability_charge
 *   - 10, 30    : blessing
 *   - 8, 20, 35 : curse
 *   - 12        : DOA
 *   - 7  : warp_green  → 22
 *   - 17 : warp_yellow → 32
 *   - 27 : warp_blue   → 42
 *   - 나머지: normal
 */
function buildTile(index: number, totalSize: number): Tile {
  if (index === totalSize - 1) return { index, type: 'goal',           warpTarget: null }
  if ([5, 15, 25].includes(index)) return { index, type: 'ability_charge', warpTarget: null }
  if ([10, 30].includes(index))    return { index, type: 'blessing',       warpTarget: null }
  if ([8, 20, 35].includes(index)) return { index, type: 'curse',          warpTarget: null }
  if (index === 12)                return { index, type: 'doa',             warpTarget: null }
  if (index === 7)                 return { index, type: 'warp_green',      warpTarget: 22 }
  if (index === 17)                return { index, type: 'warp_yellow',     warpTarget: 32 }
  if (index === 27)                return { index, type: 'warp_blue',       warpTarget: 42 }

  return { index, type: 'normal', warpTarget: null }
}
