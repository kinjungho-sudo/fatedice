'use client'

/**
 * gameStore.ts — 인게임 상태 + 소켓 액션 통합 스토어 (Zustand)
 *
 * Socket.io 이벤트 수신 + 상태 업데이트 + 액션 emit을 모두 담당.
 * 컴포넌트는 이 스토어만 사용하면 됩니다.
 */

import { create } from 'zustand'
import type { GameState, Player, BattleResult, Deck } from '../../shared/gameLogic/types'
import { initSocket, getSocket, disconnectSocket } from '../lib/socket'

// ── 공개 타입 ────────────────────────────────────────────────────────

export interface LobbyRoom {
  id:           string
  title:        string
  mode:         '1v1' | '2v2'
  hostNickname: string
  playerCount:  number
  maxPlayers:   number
  isPrivate:    boolean
  createdAt:    number
}

export interface DiceResultEvent {
  playerId: string
  rolls:    number[]
  total:    number
  newPos:   number
}

export type GameUIPhase =
  | 'idle'           // 게임 외
  | 'waiting_room'   // 방 대기 중
  | 'in_game'        // 게임 진행 중
  | 'battle_result'  // 전투 결과 표시 중
  | 'game_over'      // 게임 종료

// ── 스토어 인터페이스 ─────────────────────────────────────────────────

interface GameStore {
  // 연결 상태
  socketConnected:     boolean
  myPlayerId:          string | null
  mySocketId:          string | null   // myPlayerId 별칭 (하위 호환)

  // 로비
  lobbyRooms:          LobbyRoom[]
  roomId:              string | null   // ← currentRoomId 와 동기화
  currentRoomId:       string | null
  uiPhase:             GameUIPhase

  // 게임 상태
  gameState:           GameState | null
  isMyTurn:            boolean
  isRolling:           boolean

  // 전투/종료
  battleResult:        BattleResult | null   // 직접 참조용
  winner:              string | null          // 게임 종료 시 승자 userId

  // 이벤트 버퍼 (컴포넌트에서 애니메이션 후 null로 초기화)
  pendingDiceResult:   DiceResultEvent | null
  pendingBattleResult: { result: BattleResult } | null
  gameOver:            { winner: string; finalState: GameState } | null

  // ── 소켓 연결/해제 ──────────────────────────────────────────────
  connect:       (nickname: string, deck: object) => void
  disconnect:    () => void

  // ── 방/매칭 액션 ────────────────────────────────────────────────
  createRoom:        (userId: string, mode: '1v1' | '2v2', title?: string) => void
  joinRoom:          (roomId: string, userId: string, deck: Deck, password?: string) => void
  startMatchmaking:  (userId: string, mode: '1v1' | '2v2', deck: object) => void
  setReady:          (roomId: string, userId?: string) => void
  clearBattle:       () => void

  // ── 게임 액션 ────────────────────────────────────────────────────
  rollDice:      (roomId: string) => void
  useItem:       (roomId: string, itemId: string, targetId?: string) => void
  useAbility:    (roomId: string, abilityId: string) => void
  useBattleItem: (roomId: string, itemId: string) => void
  endTurn:       (roomId: string) => void

  // ── 상태 세터 (useSocket 훅 / 내부 전용) ────────────────────────
  setSocketConnected:  (connected: boolean, socketId?: string) => void
  setMyPlayerId:       (id: string | null) => void
  setLobbyRooms:       (rooms: LobbyRoom[]) => void
  addLobbyRoom:        (room: LobbyRoom) => void
  updateLobbyRoom:     (room: LobbyRoom) => void
  removeLobbyRoom:     (roomId: string) => void
  setCurrentRoomId:    (roomId: string | null) => void
  setGameState:        (gameState: GameState) => void
  updatePlayer:        (player: Player) => void
  setPendingDice:      (data: DiceResultEvent | null) => void
  setPendingBattle:    (data: { result: BattleResult } | null) => void
  setGameOver:         (data: { winner: string; finalState: GameState } | null) => void
  reset:               () => void
}

// ── 스토어 구현 ───────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  // 초기 상태
  socketConnected:     false,
  myPlayerId:          null,
  mySocketId:          null,
  lobbyRooms:          [],
  roomId:              null,
  currentRoomId:       null,
  uiPhase:             'idle',
  gameState:           null,
  isMyTurn:            false,
  isRolling:           false,
  battleResult:        null,
  winner:              null,
  pendingDiceResult:   null,
  pendingBattleResult: null,
  gameOver:            null,

  // ── 소켓 연결 ────────────────────────────────────────────────────
  connect: (nickname, deck) => {
    const socket = initSocket(nickname, deck)

    // 중복 등록 방지
    socket.off('connect')
    socket.off('disconnect')
    socket.off('lobby:rooms')
    socket.off('lobby:roomCreated')
    socket.off('lobby:roomUpdated')
    socket.off('lobby:roomRemoved')
    socket.off('room:created')
    socket.off('room:joined')
    socket.off('room:matched')
    socket.off('game:started')
    socket.off('game:stateUpdate')
    socket.off('game:diceResult')
    socket.off('game:battleResult')
    socket.off('game:turnChanged')
    socket.off('game:over')
    socket.off('error:game')

    socket.on('connect', () => {
      const sid = socket.id ?? null
      set({ socketConnected: true, myPlayerId: sid, mySocketId: sid })
    })
    socket.on('disconnect', () => {
      set({ socketConnected: false })
    })

    // 로비 이벤트
    socket.on('lobby:rooms',       ({ rooms }: { rooms: LobbyRoom[] }) => {
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
      set({ roomId, currentRoomId: roomId, uiPhase: 'waiting_room' })
    })
    socket.on('room:joined', ({ roomId }: { roomId: string }) => {
      set({ roomId, currentRoomId: roomId, uiPhase: 'waiting_room' })
    })
    socket.on('room:matched', ({ roomId }: { roomId: string }) => {
      set({ roomId, currentRoomId: roomId, uiPhase: 'waiting_room' })
    })

    // 게임 이벤트
    socket.on('game:started', ({ gameState }: { gameState: GameState }) => {
      const myId = get().myPlayerId
      set({
        gameState,
        uiPhase:  'in_game',
        isMyTurn: gameState.currentTurn === myId,
        gameOver: null,
      })
    })
    socket.on('game:stateUpdate', ({ gameState }: { gameState: GameState }) => {
      const myId = get().myPlayerId
      set({ gameState, isMyTurn: gameState.currentTurn === myId })
    })
    socket.on('game:diceResult', (data: DiceResultEvent) => {
      set({ pendingDiceResult: data })
    })
    socket.on('game:battleResult', (data: { result: BattleResult }) => {
      set({ pendingBattleResult: data, battleResult: data.result, uiPhase: 'battle_result' })
    })
    socket.on('game:turnChanged', ({ currentTurn, turnNumber }: { currentTurn: string; turnNumber: number }) => {
      const gs = get().gameState
      if (!gs) return
      const updated = { ...gs, currentTurn, turnNumber }
      set({ gameState: updated, isMyTurn: currentTurn === get().myPlayerId })
    })
    socket.on('game:over', (data: { winner: string; finalState: GameState }) => {
      set({ gameOver: data, gameState: data.finalState, uiPhase: 'game_over', winner: data.winner })
    })
    socket.on('error:game', ({ code, message }: { code: string; message: string }) => {
      console.error(`[Socket] 게임 오류 ${code}:`, message)
    })
  },

  disconnect: () => {
    disconnectSocket()
    set({ socketConnected: false, myPlayerId: null, mySocketId: null, uiPhase: 'idle', roomId: null, currentRoomId: null })
  },

  // ── 방/매칭 액션 ────────────────────────────────────────────────
  createRoom: (userId, mode, title) => {
    getSocket()?.emit('room:create', { userId, mode, title: title ?? `${userId}의 방` })
  },
  joinRoom: (roomId, userId, deck, password) => {
    getSocket()?.emit('room:join', { roomId, userId, deck, password })
  },
  startMatchmaking: (userId, mode, deck) => {
    getSocket()?.emit('room:matchmaking', { userId, mode, deck })
  },
  setReady: (roomId, _userId?) => {
    getSocket()?.emit('game:ready', { roomId })
  },
  clearBattle: () => set({ battleResult: null, pendingBattleResult: null, uiPhase: 'in_game' }),

  // ── 게임 액션 ────────────────────────────────────────────────────
  rollDice: (roomId) => {
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
    getSocket()?.emit('game:endTurn', { roomId })
  },

  // ── 상태 세터 ────────────────────────────────────────────────────
  setSocketConnected: (connected, socketId) =>
    set(s => ({
      socketConnected: connected,
      myPlayerId:  socketId ?? s.myPlayerId,
      mySocketId:  socketId ?? s.mySocketId,
    })),

  setMyPlayerId: (id) => set({ myPlayerId: id, mySocketId: id }),

  setLobbyRooms: (rooms) => set({ lobbyRooms: rooms }),

  addLobbyRoom: (room) =>
    set(s => ({ lobbyRooms: [...s.lobbyRooms, room] })),

  updateLobbyRoom: (room) =>
    set(s => ({ lobbyRooms: s.lobbyRooms.map(r => r.id === room.id ? room : r) })),

  removeLobbyRoom: (roomId) =>
    set(s => ({ lobbyRooms: s.lobbyRooms.filter(r => r.id !== roomId) })),

  setCurrentRoomId: (roomId) =>
    set({ currentRoomId: roomId, roomId }),

  setGameState: (gameState) =>
    set(s => ({
      gameState,
      isMyTurn: gameState.currentTurn === s.myPlayerId,
    })),

  updatePlayer: (player) =>
    set(s => {
      if (!s.gameState) return s
      const players = s.gameState.players.map(p => p.id === player.id ? player : p)
      const updated = { ...s.gameState, players }
      return { gameState: updated, isMyTurn: updated.currentTurn === s.myPlayerId }
    }),

  setPendingDice:   (data) => set({ pendingDiceResult: data }),
  setPendingBattle: (data) => set(s => ({
    pendingBattleResult: data,
    battleResult:        data?.result ?? s.battleResult,
  })),
  setGameOver: (data) => set({ gameOver: data, winner: data?.winner ?? null }),

  reset: () =>
    set({
      gameState:           null,
      isMyTurn:            false,
      isRolling:           false,
      battleResult:        null,
      winner:              null,
      pendingDiceResult:   null,
      pendingBattleResult: null,
      gameOver:            null,
      currentRoomId:       null,
      roomId:              null,
    }),
}))
