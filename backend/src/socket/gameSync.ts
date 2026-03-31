/**
 * gameSync.ts — 게임 상태 동기화 & 연결 끊김 처리
 *
 * 역할:
 *  - 전체 GameState 브로드캐스트
 *  - 턴 전환 로직
 *  - 접속 끊김 30초 타이머 → 몰수패 처리
 *  - 게임 종료 후 DB 저장 (matches + rankings)
 */

import { Server } from 'socket.io'
import type { GameState, Player } from '../../../shared/gameLogic/types'
import { initBoard } from '../../../shared/gameLogic/board'
import { getCharacterById } from '../api/characters/data'
import {
  getRoomById,
  setGameState,
  setPlayerConnected,
  finishRoom,
  type Room,
  type RoomPlayer,
} from './roomManager'
import { supabase } from '../lib/supabaseClient'

// 연결 끊김 타이머 Map: socketId → NodeJS.Timeout
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()

// ──────────────────────────────────────────────────────────
// 게임 초기 상태 생성
// ──────────────────────────────────────────────────────────
export function createInitialGameState(room: Room): GameState {
  // ✅ Agent1 initBoard() 사용 (50타일 표준 보드)
  const board = initBoard()

  const players: Player[] = room.players.map((rp: RoomPlayer) => ({
    id:            rp.socketId,
    userId:        rp.userId,
    nickname:      rp.nickname,
    party:         buildPartyFromDeck(rp),  // ✅ Agent3 data.ts 카탈로그에서 캐릭터 조회
    position:      0,
    ag:            0,
    items:         [],
    activeAbility: null,
    isConnected:   true,
  }))

  // 첫 번째 플레이어가 선공
  const state: GameState = {
    roomId:      room.id,
    mode:        room.mode,
    players,
    currentTurn: players[0].id,
    turnNumber:  1,
    phase:       'rolling',
    boardState:  board,
    winner:      null,
    startedAt:   Date.now(),
  }

  setGameState(room.id, state)
  return state
}

// ──────────────────────────────────────────────────────────
// 상태 전체 브로드캐스트
// ──────────────────────────────────────────────────────────
export function broadcastState(io: Server, roomId: string): void {
  const room = getRoomById(roomId)
  if (!room?.gameState) return

  io.to(roomId).emit('game:stateUpdate', { gameState: room.gameState })
}

// ──────────────────────────────────────────────────────────
// 턴 전환
// ──────────────────────────────────────────────────────────
export function nextTurn(roomId: string): GameState | null {
  const room = getRoomById(roomId)
  if (!room?.gameState) return null

  const state = room.gameState
  const currentIdx = state.players.findIndex(p => p.id === state.currentTurn)
  const nextIdx    = (currentIdx + 1) % state.players.length

  const updated: GameState = {
    ...state,
    currentTurn: state.players[nextIdx].id,
    turnNumber:  state.turnNumber + 1,
    phase:       'rolling',
  }

  room.gameState = updated
  return updated
}

// ──────────────────────────────────────────────────────────
// 접속 끊김 처리 (30초 타이머)
// ──────────────────────────────────────────────────────────
export function handleDisconnect(
  io: Server,
  socketId: string,
  roomId: string
): void {
  setPlayerConnected(roomId, socketId, false)

  io.to(roomId).emit('game:playerDisconnected', {
    playerId: socketId,
    timeout:  30,
  })

  // 기존 타이머가 있으면 취소
  clearDisconnectTimer(socketId)

  const timer = setTimeout(async () => {
    const room = getRoomById(roomId)
    if (!room?.gameState) return

    // 재접속 안 했으면 몰수패
    const disconnectedPlayer = room.gameState.players.find(p => p.id === socketId)
    if (disconnectedPlayer && !disconnectedPlayer.isConnected) {
      const winner = room.gameState.players.find(p => p.id !== socketId)
      if (winner) {
        await resolveGameOver(io, roomId, winner.userId, disconnectedPlayer.userId)
      }
    }

    disconnectTimers.delete(socketId)
  }, 30_000)

  disconnectTimers.set(socketId, timer)
}

/** 재접속 시 타이머 취소 */
export function handleReconnect(
  socketId: string,
  roomId: string
): void {
  clearDisconnectTimer(socketId)
  setPlayerConnected(roomId, socketId, true)
}

function clearDisconnectTimer(socketId: string): void {
  const existing = disconnectTimers.get(socketId)
  if (existing) {
    clearTimeout(existing)
    disconnectTimers.delete(socketId)
  }
}

// ──────────────────────────────────────────────────────────
// 게임 종료 처리
// ──────────────────────────────────────────────────────────
export async function resolveGameOver(
  io: Server,
  roomId: string,
  winnerUserId: string,
  loserUserId: string
): Promise<void> {
  const room = getRoomById(roomId)
  if (!room?.gameState) return

  const finalState: GameState = {
    ...room.gameState,
    winner: winnerUserId,
    phase:  'finished',
  }
  room.gameState = finalState

  // 클라이언트에 게임 종료 알림
  io.to(roomId).emit('game:over', {
    winner:     winnerUserId,
    finalState,
  })

  // DB 저장 (비동기, 실패해도 게임 진행에 영향 없음)
  await Promise.allSettled([
    saveMatchResult(room, winnerUserId),
    updateRankings(winnerUserId, loserUserId),
  ])

  finishRoom(roomId)
}

// ──────────────────────────────────────────────────────────
// DB 저장
// ──────────────────────────────────────────────────────────
async function saveMatchResult(room: Room, winnerUserId: string): Promise<void> {
  if (!room.gameState) return

  const duration = Math.floor((Date.now() - room.gameState.startedAt) / 1000)
  const players  = room.gameState.players.map(p => ({
    userId:   p.userId,
    nickname: p.nickname,
  }))

  await supabase.from('matches').insert({
    room_id:   room.id,
    mode:      room.mode,
    winner_id: winnerUserId,
    players,
    duration,
  })
}

async function updateRankings(winnerId: string, loserId: string): Promise<void> {
  // ranking/routes.ts의 POST /api/ranking/update를 내부 호출 대신 직접 처리
  const { data: rankings } = await supabase
    .from('rankings')
    .select('user_id, rating, wins, losses')
    .in('user_id', [winnerId, loserId])

  if (!rankings || rankings.length < 2) return

  const winnerR = rankings.find(r => r.user_id === winnerId)!
  const loserR  = rankings.find(r => r.user_id === loserId)!

  const K = 32
  const expectedWinner = 1 / (1 + Math.pow(10, (loserR.rating  - winnerR.rating) / 400))
  const expectedLoser  = 1 / (1 + Math.pow(10, (winnerR.rating - loserR.rating)  / 400))

  const newWinnerRating = Math.round(winnerR.rating + K * (1 - expectedWinner))
  const newLoserRating  = Math.max(100, Math.round(loserR.rating + K * (0 - expectedLoser)))

  await Promise.all([
    supabase.from('rankings').update({
      wins:   winnerR.wins + 1,
      rating: newWinnerRating,
      updated_at: new Date().toISOString(),
    }).eq('user_id', winnerId),

    supabase.from('rankings').update({
      losses: loserR.losses + 1,
      rating: newLoserRating,
      updated_at: new Date().toISOString(),
    }).eq('user_id', loserId),
  ])
}

// ──────────────────────────────────────────────────────────
// 덱 → Party 변환
// Agent3 data.ts 정적 카탈로그에서 캐릭터 조회 (DB 불필요)
// ──────────────────────────────────────────────────────────
export function buildPartyFromDeck(rp: RoomPlayer) {
  const attacker     = getCharacterById(rp.deck.attackerId)
  const defender     = getCharacterById(rp.deck.defenderId)
  const intelligence = getCharacterById(rp.deck.intelligenceId)

  if (!attacker || !defender || !intelligence) {
    throw new Error(
      `[gameSync] 덱에 존재하지 않는 캐릭터 ID가 포함되어 있습니다. ` +
      `(attacker: ${rp.deck.attackerId}, defender: ${rp.deck.defenderId}, intelligence: ${rp.deck.intelligenceId})`
    )
  }

  return { attacker, defender, intelligence }
}
