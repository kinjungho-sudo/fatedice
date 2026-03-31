/**
 * roomManager.ts — 룸 생성/관리 (서버 메모리 기반, Redis는 v2)
 *
 * 역할:
 *  - 룸 CRUD (create / join / leave)
 *  - 자동 매칭 큐 관리
 *  - 룸 상태 조회
 */

import { v4 as uuidv4 } from 'uuid'
import type { GameState, Player, Deck, LobbyRoom } from '../../../shared/gameLogic/types'

// ──────────────────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────────────────
export interface RoomPlayer {
  socketId:  string
  userId:    string
  nickname:  string
  deck:      Deck
  isReady:   boolean
}

export interface Room {
  id:         string
  title:      string          // 방 제목
  mode:       '1v1' | '2v2'
  players:    RoomPlayer[]
  maxPlayers: 2 | 4
  gameState:  GameState | null
  status:     'waiting' | 'playing' | 'finished'
  isPrivate:  boolean         // 비공개 방 여부
  password?:  string          // 서버 메모리에만 보관 — 클라이언트에 노출 금지
  createdAt:  number          // Unix timestamp
}

// ──────────────────────────────────────────────────────────
// 서버 메모리 저장소
// ──────────────────────────────────────────────────────────
const rooms = new Map<string, Room>()

/** 매칭 큐: mode → 대기 중인 RoomPlayer[] */
const matchmakingQueue = new Map<'1v1' | '2v2', RoomPlayer[]>([
  ['1v1', []],
  ['2v2', []],
])

// ──────────────────────────────────────────────────────────
// 룸 생성
// ──────────────────────────────────────────────────────────
export interface CreateRoomOptions {
  title?:     string
  isPrivate?: boolean
  password?:  string
}

export function createRoom(
  mode: '1v1' | '2v2',
  creator: RoomPlayer,
  opts: CreateRoomOptions = {}
): Room {
  const room: Room = {
    id:         uuidv4(),
    title:      opts.title ?? `${creator.nickname}의 방`,
    mode,
    players:    [creator],
    maxPlayers: mode === '1v1' ? 2 : 4,
    gameState:  null,
    status:     'waiting',
    isPrivate:  opts.isPrivate ?? false,
    password:   opts.password,
    createdAt:  Date.now(),
  }
  rooms.set(room.id, room)
  return room
}

// ──────────────────────────────────────────────────────────
// 룸 입장
// ──────────────────────────────────────────────────────────
export function joinRoom(
  roomId:   string,
  player:   RoomPlayer,
  password?: string
): { room: Room; error?: string } {
  const room = rooms.get(roomId)

  if (!room) {
    return { room: {} as Room, error: '존재하지 않는 방입니다.' }
  }
  if (room.status !== 'waiting') {
    return { room, error: '이미 게임이 시작된 방입니다.' }
  }
  if (room.players.length >= room.maxPlayers) {
    return { room, error: '방이 꽉 찼습니다.' }
  }
  if (room.players.some(p => p.userId === player.userId)) {
    return { room, error: '이미 입장한 방입니다.' }
  }
  if (room.isPrivate && room.password && room.password !== password) {
    return { room, error: '비밀번호가 올바르지 않습니다.' }
  }

  room.players.push(player)
  return { room }
}

// ──────────────────────────────────────────────────────────
// 룸 퇴장
// ──────────────────────────────────────────────────────────
export function leaveRoom(roomId: string, socketId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null

  room.players = room.players.filter(p => p.socketId !== socketId)

  // 빈 방이면 삭제
  if (room.players.length === 0) {
    rooms.delete(roomId)
    return null
  }

  return room
}

// ──────────────────────────────────────────────────────────
// 자동 매칭
// ──────────────────────────────────────────────────────────
export function enqueueMatchmaking(
  player: RoomPlayer,
  mode: '1v1' | '2v2'
): Room | null {
  const queue = matchmakingQueue.get(mode)!
  const required = mode === '1v1' ? 2 : 4

  // 이미 큐에 있으면 무시
  if (queue.some(p => p.userId === player.userId)) return null

  queue.push(player)

  // 필요 인원이 모이면 방 생성
  if (queue.length >= required) {
    const matched = queue.splice(0, required)
    const host = matched[0]
    const room = createRoom(mode, host)

    for (let i = 1; i < matched.length; i++) {
      room.players.push(matched[i])
    }

    return room
  }

  return null
}

export function dequeueMatchmaking(socketId: string): void {
  for (const queue of matchmakingQueue.values()) {
    const idx = queue.findIndex(p => p.socketId === socketId)
    if (idx !== -1) {
      queue.splice(idx, 1)
      break
    }
  }
}

// ──────────────────────────────────────────────────────────
// 조회 헬퍼
// ──────────────────────────────────────────────────────────
export function getRoomById(roomId: string): Room | undefined {
  return rooms.get(roomId)
}

export function getRoomBySocketId(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.socketId === socketId)) {
      return room
    }
  }
  return undefined
}

/** 모든 플레이어가 ready 상태인지 확인 */
export function isRoomReady(room: Room): boolean {
  return (
    room.players.length === room.maxPlayers &&
    room.players.every(p => p.isReady)
  )
}

/** 플레이어 ready 상태 토글 */
export function setPlayerReady(roomId: string, socketId: string): Room | null {
  const room = rooms.get(roomId)
  if (!room) return null

  const player = room.players.find(p => p.socketId === socketId)
  if (player) player.isReady = true

  return room
}

/** 게임 상태 저장 */
export function setGameState(roomId: string, state: GameState): void {
  const room = rooms.get(roomId)
  if (room) {
    room.gameState = state
    room.status    = 'playing'
  }
}

/** 게임 종료 처리 */
export function finishRoom(roomId: string): void {
  const room = rooms.get(roomId)
  if (room) {
    room.status = 'finished'
    // 5분 후 방 정리
    setTimeout(() => rooms.delete(roomId), 5 * 60 * 1000)
  }
}

/** 플레이어 연결 상태 업데이트 */
export function setPlayerConnected(
  roomId: string,
  socketId: string,
  connected: boolean
): void {
  const room = rooms.get(roomId)
  if (!room || !room.gameState) return

  const player = room.gameState.players.find(p => p.id === socketId)
  if (player) player.isConnected = connected
}

// ──────────────────────────────────────────────────────────
// 로비용 조회 함수
// ──────────────────────────────────────────────────────────

/** 로비에 표시할 공개 방 목록 (password 필드 제외) */
export function getPublicRooms(mode?: '1v1' | '2v2'): LobbyRoom[] {
  const result: LobbyRoom[] = []

  for (const room of rooms.values()) {
    if (room.status !== 'waiting') continue
    if (mode && room.mode !== mode) continue

    result.push({
      id:           room.id,
      title:        room.title,
      mode:         room.mode,
      playerCount:  room.players.length,
      maxPlayers:   room.maxPlayers,
      isPrivate:    room.isPrivate,
      hostNickname: room.players[0]?.nickname ?? 'Unknown',
      createdAt:    room.createdAt,
    })
  }

  // 최신 생성 순 정렬
  return result.sort((a, b) => b.createdAt - a.createdAt)
}

/** 매칭 큐 대기자 수 */
export function getQueueLength(mode: '1v1' | '2v2'): number {
  return matchmakingQueue.get(mode)?.length ?? 0
}

/** 방을 LobbyRoom 형식으로 변환 (password 제외) */
export function toLobbyRoom(room: Room): LobbyRoom {
  return {
    id:           room.id,
    title:        room.title,
    mode:         room.mode,
    playerCount:  room.players.length,
    maxPlayers:   room.maxPlayers,
    isPrivate:    room.isPrivate,
    hostNickname: room.players[0]?.nickname ?? 'Unknown',
    createdAt:    room.createdAt,
  }
}
