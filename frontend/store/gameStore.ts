'use client'

/**
 * gameStore.ts — 인게임 상태 + 소켓 액션 통합 스토어 (Zustand)
 *
 * ★ 소켓 이벤트 수신 → 스토어 상태 갱신 → 컴포넌트 리렌더
 * ★ 게임 로직 직접 계산 금지 — 서버 이벤트 결과만 저장
 */

import { create } from 'zustand'
import type {
  GameState,
  BattleResult,
  TileEvent,
  LobbyRoom,
} from '@shared/gameLogic/types'
import { initSocket, getSocket, disconnectSocket } from '../lib/socket'

// ── 공개 타입 ────────────────────────────────────────────────────────

export type GameUIPhase =
  | 'idle'           // 게임 외
  | 'waiting_room'   // 방 대기 중
  | 'in_game'        // 게임 진행 중
  | 'battle_result'  // 전투 결과 표시 중
  | 'game_over'      // 게임 종료

export interface DiceResultEvent {
  playerId: string
  rolls:    number[]
  total:    number
  newPos:   number
}

interface GameEvent {
  type:    'dice' | 'tile' | 'battle' | 'item' | 'ability' | 'system'
  message: string
  data?:   unknown
}

// ── 스토어 인터페이스 ─────────────────────────────────────────────────

interface GameStore {
  // 연결 상태
  socketConnected: boolean
  mySocketId:      string | null

  // 로비
  lobbyRooms: LobbyRoom[]
  roomId:     string | null
  uiPhase:    GameUIPhase

  // 게임 상태
  gameState:     GameState | null
  battleResult:  BattleResult | null
  lastTileEvent: TileEvent | null
  winner:        string | null   // 게임 종료 시 승자 userId
  eventLog:      GameEvent[]
  isRolling:     boolean

  // 소켓 연결/해제
  connect:    (nickname: string, deck: object) => void
  disconnect: () => void

  // 방/매칭 액션
  createRoom:       (userId: string, mode: '1v1' | '2v2', title?: string) => void
  joinRoom:         (roomId: string, userId: string, deck: object) => void
  startMatchmaking: (userId: string, mode: '1v1' | '2v2', deck: object) => void
  setReady:         (roomId: string, userId: string) => void

  // 게임 액션
  rollDice:     (roomId: string) => void
  useItem:      (roomId: string, itemId: string, targetId?: string) => void
  useAbility:   (roomId: string, abilityId: string) => void
  useBattleItem:(roomId: string, itemId: string) => void
  endTurn:      (roomId: string) => void
  clearBattle:  () => void
  addEvent:     (event: GameEvent) => void
}

// ── 스토어 구현 ───────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  socketConnected: false,
  mySocketId:      null,
  lobbyRooms:      [],
  roomId:          null,
  uiPhase:         'idle',
  gameState:       null,
  battleResult:    null,
  lastTileEvent:   null,
  winner:          null,
  eventLog:        [],
  isRolling:       false,

  // ── 소켓 연결 ────────────────────────────────────────────────────
  connect: (nickname, deck) => {
    const socket = initSocket(nickname, deck)

    // 중복 등록 방지
    const events = [
      'connect', 'disconnect',
      'lobby:rooms', 'lobby:roomCreated', 'lobby:roomUpdated', 'lobby:roomRemoved',
      'room:created', 'room:joined', 'room:matched',
      'game:started', 'game:stateUpdate', 'game:diceResult',
      'game:battleResult', 'game:turnChanged', 'game:over', 'error:game',
    ]
    events.forEach(e => socket.off(e))

    socket.on('connect', () => {
      set({ socketConnected: true, mySocketId: socket.id ?? null })
    })
    socket.on('disconnect', () => {
      set({ socketConnected: false })
    })

    // 로비 이벤트
    socket.on('lobby:rooms', ({ rooms }: { rooms: LobbyRoom[] }) => {
      set({ lobbyRooms: rooms })
    })
    socket.on('lobby:roomCreated', ({ room }: { room: LobbyRoom }) => {
      set(s => ({ lobbyRooms: [...s.lobbyRooms, room] }))
    })
    socket.on('lobby:roomUpdated', ({ room }: { room: LobbyRoom }) => {
      set(s => ({ lobbyRooms: s.lobbyRooms.map(r => r.id === room.id ? room : r) }))
    })
    socket.on('lobby:roomRemoved', ({ roomId }: { roomId: string }) => {
      set(s => ({ lobbyRooms: s.lobbyRooms.filter(r => r.id !== roomId) }))
    })

    // 방/매칭 이벤트
    socket.on('room:created', ({ roomId }: { roomId: string }) => {
      set({ roomId, uiPhase: 'waiting_room' })
      get().addEvent({ type: 'system', message: `방 생성됨: ${roomId}` })
    })
    socket.on('room:joined', ({ roomId }: { roomId: string }) => {
      set({ roomId, uiPhase: 'waiting_room' })
      get().addEvent({ type: 'system', message: `방 입장: ${roomId}` })
    })
    socket.on('room:matched', ({ roomId }: { roomId: string }) => {
      set({ roomId, uiPhase: 'waiting_room' })
      get().addEvent({ type: 'system', message: '매치 성사!' })
    })

    // 게임 이벤트
    socket.on('game:started', ({ gameState }: { gameState: GameState }) => {
      set({ gameState, uiPhase: 'in_game', winner: null })
      get().addEvent({ type: 'system', message: '게임 시작!' })
    })
    socket.on('game:stateUpdate', ({ gameState, tileEvent }: {
      gameState: GameState
      tileEvent?: TileEvent
    }) => {
      set({ gameState, isRolling: false, lastTileEvent: tileEvent ?? null })
    })
    socket.on('game:diceResult', (data: DiceResultEvent) => {
      get().addEvent({ type: 'dice', message: `주사위: ${data.total}`, data })
    })
    socket.on('game:battleResult', ({ result }: { result: BattleResult }) => {
      set({ battleResult: result, uiPhase: 'battle_result' })
      const msg = result.winner === 'draw'
        ? '무승부!'
        : `${result.winner === 'attacker' ? '공격' : '방어'} 승리! (차이: ${result.diff})${result.isGenesisReturn ? ' 태초귀환!' : ''}`
      get().addEvent({ type: 'battle', message: msg, data: result })
    })
    socket.on('game:turnChanged', ({
      currentTurn, turnNumber,
    }: { currentTurn: string; turnNumber: number }) => {
      const gs = get().gameState
      if (gs) set({ gameState: { ...gs, currentTurn, turnNumber } })
    })
    socket.on('game:over', ({ winner, finalState }: {
      winner: string
      finalState: GameState
    }) => {
      set({ gameState: finalState, uiPhase: 'game_over', winner })
      get().addEvent({ type: 'system', message: `게임 종료! 승자: ${winner}` })
    })
    socket.on('error:game', ({ code, message }: { code: string; message: string }) => {
      console.error(`[Socket] 게임 오류 ${code}:`, message)
      get().addEvent({ type: 'system', message: `오류: ${message}` })
    })
  },

  disconnect: () => {
    disconnectSocket()
    set({ socketConnected: false, mySocketId: null, uiPhase: 'idle', roomId: null })
  },

  // ── 방/매칭 액션 ────────────────────────────────────────────────
  createRoom: (userId, mode, title) => {
    getSocket()?.emit('room:create', { userId, mode, title: title ?? `${userId}의 방` })
  },
  joinRoom: (roomId, userId, deck) => {
    getSocket()?.emit('room:join', { roomId, userId, deck })
  },
  startMatchmaking: (userId, mode, deck) => {
    getSocket()?.emit('room:matchmaking', { userId, mode, deck })
  },
  setReady: (roomId, userId) => {
    getSocket()?.emit('game:ready', { roomId, userId })
  },

  // ── 게임 액션 ────────────────────────────────────────────────────
  rollDice: (roomId) => {
    set({ isRolling: true })
    getSocket()?.emit('game:rollDice', { roomId })
  },
  useItem: (roomId, itemId, targetId) => {
    getSocket()?.emit('game:useItem', { roomId, itemId, targetId })
  },
  useAbility: (roomId, abilityId) => {
    getSocket()?.emit('game:useAbility', { roomId, abilityId })
  },
  useBattleItem: (roomId, itemId) => {
    getSocket()?.emit('game:battleItem', { roomId, itemId })
  },
  endTurn: (roomId) => {
    set({ uiPhase: 'in_game', battleResult: null, lastTileEvent: null })
    getSocket()?.emit('game:endTurn', { roomId })
  },

  clearBattle: () => {
    set({ battleResult: null, uiPhase: 'in_game' })
  },

  addEvent: (event) => {
    set(s => ({ eventLog: [event, ...s.eventLog].slice(0, 50) }))
  },
}))
