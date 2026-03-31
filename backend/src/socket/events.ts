/**
 * events.ts — Socket.io 이벤트 핸들러
 *
 * EVENTS.md 기준 100% 일치 필수
 * 게임 로직 직접 계산 절대 금지 — shared/gameLogic 함수 사용
 *
 * 클라이언트 → 서버: lobby:subscribe, lobby:unsubscribe, lobby:getRooms,
 *                     room:create, room:join, room:matchmaking, room:leave,
 *                     game:ready, game:rollDice, game:useItem,
 *                     game:useAbility, game:battleItem, game:endTurn
 */

import type { Server, Socket } from 'socket.io'
import type {
  RoomCreatePayload,
  RoomCreateExtPayload,
  RoomJoinPayload,
  RoomJoinExtPayload,
  RoomMatchmakingPayload,
  GameUseItemPayload,
  GameUseAbilityPayload,
  GameBattleItemPayload,
  LobbyGetRoomsPayload,
  Deck,
} from '../../../shared/gameLogic/types'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  enqueueMatchmaking,
  dequeueMatchmaking,
  getRoomById,
  getRoomBySocketId,
  getPublicRooms,
  setPlayerReady,
  isRoomReady,
  toLobbyRoom,
  type Room,
  type RoomPlayer,
} from './roomManager'
import {
  createInitialGameState,
  broadcastState,
  nextTurn,
  handleDisconnect,
  handleReconnect,
  resolveGameOver,
} from './gameSync'

// ──────────────────────────────────────────────────────────
// shared/gameLogic 함수 import (Agent1 구현 완료)
// ──────────────────────────────────────────────────────────
import { rollMovement } from '../../../shared/gameLogic/dice'
import { executeBattle, getBattleLoser, getBattleWinner } from '../../../shared/gameLogic/battle'
import { movePlayer, checkCollision, isGoal, applyDOA } from '../../../shared/gameLogic/board'
import { chargeAG, chargeTileBonus, applyCursePenalty, canActivate, activateAbility, tickAbilityDuration } from '../../../shared/gameLogic/skills'
import { canUseItem, removeItem, getUsableItems } from '../../../shared/gameLogic/items'

// ──────────────────────────────────────────────────────────
// 이벤트 핸들러 등록
// ──────────────────────────────────────────────────────────
export function registerSocketEvents(io: Server, socket: Socket): void {

  // ────────────────────────────────────────────────────────
  // lobby:subscribe — 로비 실시간 업데이트 구독
  //   소켓을 'lobby' 룸에 입장시켜 lobby:* 브로드캐스트 수신
  // ────────────────────────────────────────────────────────
  socket.on('lobby:subscribe', () => {
    socket.join('lobby')
  })

  // ────────────────────────────────────────────────────────
  // lobby:unsubscribe — 로비 구독 해제
  // ────────────────────────────────────────────────────────
  socket.on('lobby:unsubscribe', () => {
    socket.leave('lobby')
  })

  // ────────────────────────────────────────────────────────
  // lobby:getRooms — 현재 대기 중인 방 목록 요청
  // ────────────────────────────────────────────────────────
  socket.on('lobby:getRooms', (payload: LobbyGetRoomsPayload = {}) => {
    const rooms = getPublicRooms(payload.mode)
    socket.emit('lobby:rooms', { rooms })
  })

  // ────────────────────────────────────────────────────────
  // room:create — 방 생성
  // ────────────────────────────────────────────────────────
  socket.on('room:create', (payload: RoomCreateExtPayload) => {
    const { mode, userId, title, isPrivate, password } = payload
    if (!mode || !userId) {
      return socket.emit('error:game', { code: 'INVALID_PAYLOAD', message: 'mode, userId는 필수입니다.' })
    }

    const nickname = socket.data.nickname ?? 'Unknown'
    const deck: Deck = socket.data.deck ?? { attackerId: '', defenderId: '', intelligenceId: '' }

    const creator: RoomPlayer = { socketId: socket.id, userId, nickname, deck, isReady: false }
    const room = createRoom(mode, creator, { title, isPrivate, password })

    socket.join(room.id)
    socket.emit('room:created', { roomId: room.id, mode: room.mode, title: room.title })

    // 공개 방이면 로비 구독자에게 브로드캐스트
    if (!room.isPrivate) {
      io.to('lobby').emit('lobby:roomCreated', { room: toLobbyRoom(room) })
    }
  })

  // ────────────────────────────────────────────────────────
  // room:join — 방 입장
  // ────────────────────────────────────────────────────────
  socket.on('room:join', (payload: RoomJoinExtPayload) => {
    const { roomId, userId, deck, password } = payload
    if (!roomId || !userId || !deck) {
      return socket.emit('error:game', { code: 'INVALID_PAYLOAD', message: 'roomId, userId, deck은 필수입니다.' })
    }

    const existingRoom = getRoomById(roomId)
    if (!existingRoom) {
      return socket.emit('error:game', { code: 'ROOM_NOT_FOUND', message: '방을 찾을 수 없습니다.' })
    }
    if (existingRoom.players.length >= existingRoom.maxPlayers) {
      return socket.emit('room:full', { roomId })
    }

    const nickname = socket.data.nickname ?? 'Unknown'
    const player: RoomPlayer = { socketId: socket.id, userId, nickname, deck, isReady: false }
    const { room, error } = joinRoom(roomId, player, password)

    if (error) {
      return socket.emit('error:game', { code: 'JOIN_FAILED', message: error })
    }

    socket.join(roomId)
    io.to(roomId).emit('room:joined', {
      roomId:  room.id,
      players: room.players.map(p => ({ userId: p.userId, nickname: p.nickname, isReady: p.isReady })),
    })

    // 로비 구독자에게 방 인원 변경 알림
    if (!room.isPrivate) {
      io.to('lobby').emit('lobby:roomUpdated', { room: toLobbyRoom(room) })
    }
  })

  // ────────────────────────────────────────────────────────
  // room:matchmaking — 자동 매칭
  // ────────────────────────────────────────────────────────
  socket.on('room:matchmaking', (payload: RoomMatchmakingPayload) => {
    const { mode, userId, deck } = payload
    if (!mode || !userId || !deck) {
      return socket.emit('error:game', { code: 'INVALID_PAYLOAD', message: 'mode, userId, deck은 필수입니다.' })
    }

    const nickname = socket.data.nickname ?? 'Unknown'
    const player: RoomPlayer = { socketId: socket.id, userId, nickname, deck, isReady: false }
    const matched = enqueueMatchmaking(player, mode)

    if (matched) {
      // 매칭 완료: 모든 플레이어를 방에 입장시킴
      for (const rp of matched.players) {
        const playerSocket = io.sockets.sockets.get(rp.socketId)
        if (playerSocket) {
          playerSocket.join(matched.id)
          playerSocket.emit('room:matched', {
            roomId:   matched.id,
            opponent: matched.players
              .filter(p => p.socketId !== rp.socketId)
              .map(p => ({ userId: p.userId, nickname: p.nickname })),
          })
        }
      }
    }
    // else: 큐에 추가됨, 매칭 대기 중 (클라이언트 측에서 로딩 표시)
  })

  // ────────────────────────────────────────────────────────
  // room:leave — 방 나가기
  // ────────────────────────────────────────────────────────
  socket.on('room:leave', ({ roomId }: { roomId: string }) => {
    cleanupFromRoom(io, socket, roomId)
  })

  // ────────────────────────────────────────────────────────
  // game:ready — 게임 준비 완료
  // ────────────────────────────────────────────────────────
  socket.on('game:ready', ({ roomId }: { roomId: string }) => {
    const room = setPlayerReady(roomId, socket.id)
    if (!room) {
      return socket.emit('error:game', { code: 'ROOM_NOT_FOUND', message: '방을 찾을 수 없습니다.' })
    }

    if (isRoomReady(room)) {
      const gameState = createInitialGameState(room)
      io.to(roomId).emit('game:started', { gameState })
    }
  })

  // ────────────────────────────────────────────────────────
  // game:rollDice — 이동 주사위 굴리기
  // ────────────────────────────────────────────────────────
  socket.on('game:rollDice', ({ roomId }: { roomId: string }) => {
    const room = getRoomById(roomId)
    if (!room?.gameState) {
      return socket.emit('error:game', { code: 'GAME_NOT_FOUND', message: '게임 상태를 찾을 수 없습니다.' })
    }

    const state = room.gameState
    if (state.currentTurn !== socket.id) {
      return socket.emit('error:game', { code: 'NOT_YOUR_TURN', message: '현재 당신의 턴이 아닙니다.' })
    }
    if (state.phase !== 'rolling') {
      return socket.emit('error:game', { code: 'WRONG_PHASE', message: '주사위를 굴릴 수 없는 페이즈입니다.' })
    }

    const player = state.players.find(p => p.id === socket.id)!
    const mov    = player.party.attacker.stats.mov

    // ✅ Agent1 rollMovement() 사용 (1D6 or 2D4)
    const steps = rollMovement(mov)

    // ✅ Agent1 movePlayer() 사용 — 워프/DOA/골 자동 처리
    const { player: movedPlayer, path, tileEvent } = movePlayer(player, state.boardState, steps)

    // 플레이어 상태 업데이트
    const playerIdx = state.players.findIndex(p => p.id === socket.id)
    state.players[playerIdx] = movedPlayer

    io.to(roomId).emit('game:diceResult', {
      playerId: socket.id,
      rolls:    [steps],
      total:    steps,
      newPos:   movedPlayer.position,
    })

    // ✅ 타일 이벤트 처리 (Agent1 tileEvent 결과 활용)
    if (tileEvent) {
      // AG 변화 적용
      let updatedPlayer = state.players[playerIdx]
      if (tileEvent.type === 'ability_charge') {
        updatedPlayer = chargeTileBonus(updatedPlayer)
      } else if (tileEvent.type === 'curse') {
        updatedPlayer = applyCursePenalty(updatedPlayer)
      }
      state.players[playerIdx] = updatedPlayer

      io.to(roomId).emit('game:tileEvent', {
        playerId: socket.id,
        tileType: tileEvent.type,
        effect:   tileEvent.data,
      })
    }

    // ✅ AG 충전 (이동 칸 수 기반)
    state.players[playerIdx] = chargeAG(state.players[playerIdx], steps)

    // ✅ 골 도달 판정
    if (isGoal(movedPlayer, state.boardState)) {
      resolveGameOver(io, roomId, player.userId, getOpponentUserId(state, socket.id))
      return
    }

    // ✅ 충돌 감지 — 같은 타일에 상대방이 있으면 전투 시작
    const opponent = checkCollision(state.players, movedPlayer.position, socket.id)
    if (opponent) {
      state.phase = 'battle'
      io.to(roomId).emit('game:battleStart', {
        attackerId: socket.id,
        defenderId: opponent.id,
      })

      // ✅ Agent1 executeBattle() 사용 — 아이템 없는 순수 전투
      const battleResult = executeBattle(movedPlayer, opponent)

      // 패배자 위치 업데이트
      const loserId = getBattleLoser(battleResult)
      if (loserId) {
        const loserIdx = state.players.findIndex(p => p.id === loserId)
        if (loserIdx !== -1) {
          state.players[loserIdx] = {
            ...state.players[loserIdx],
            position: battleResult.loserNewPos,
          }
        }
      }

      io.to(roomId).emit('game:battleResult', { result: battleResult })

      // 태초 귀환이면 DOA 로그
      if (battleResult.isGenesisReturn) {
        io.to(roomId).emit('game:tileEvent', {
          playerId: loserId,
          tileType: 'doa',
          effect:   { message: '태초 귀환 — 타일 0으로 이동' },
        })
      }

      state.phase = 'result'
    } else {
      state.phase = 'moving'
    }

    broadcastState(io, roomId)
  })

  // ────────────────────────────────────────────────────────
  // game:useItem — 아이템 사용
  // ────────────────────────────────────────────────────────
  socket.on('game:useItem', (payload: GameUseItemPayload) => {
    const { roomId, itemId } = payload
    const room = getRoomById(roomId)
    if (!room?.gameState) {
      return socket.emit('error:game', { code: 'GAME_NOT_FOUND', message: '게임 상태를 찾을 수 없습니다.' })
    }

    const player = room.gameState.players.find(p => p.id === socket.id)
    if (!player) {
      return socket.emit('error:game', { code: 'PLAYER_NOT_FOUND', message: '플레이어를 찾을 수 없습니다.' })
    }

    const itemIdx = player.items.findIndex(it => it.id === itemId)
    if (itemIdx === -1) {
      return socket.emit('error:game', { code: 'ITEM_NOT_FOUND', message: '해당 아이템이 없습니다.' })
    }

    const item = player.items[itemIdx]
    const currentPhase = room.gameState.phase

    // ✅ Agent1 canUseItem()으로 사용 타이밍 검증
    const timing = currentPhase === 'battle' ? 'during_battle' : 'before_roll'
    if (!canUseItem(item, timing)) {
      return socket.emit('error:game', {
        code: 'WRONG_TIMING',
        message: `이 아이템은 ${item.useTiming} 타이밍에만 사용 가능합니다.`,
      })
    }

    // ✅ Agent1 removeItem()으로 인벤토리에서 제거
    const updatedPlayer = removeItem(player, itemId)
    const pIdx = room.gameState.players.findIndex(p => p.id === socket.id)
    room.gameState.players[pIdx] = updatedPlayer

    io.to(roomId).emit('game:itemUsed', {
      playerId: socket.id,
      item,
      effect:   { effectType: item.effectType, value: item.value },
    })

    broadcastState(io, roomId)
  })

  // ────────────────────────────────────────────────────────
  // game:useAbility — 어빌리티 발동
  // ────────────────────────────────────────────────────────
  socket.on('game:useAbility', (payload: GameUseAbilityPayload) => {
    const { roomId, abilityId } = payload
    const room = getRoomById(roomId)
    if (!room?.gameState) {
      return socket.emit('error:game', { code: 'GAME_NOT_FOUND', message: '게임 상태를 찾을 수 없습니다.' })
    }

    const player = room.gameState.players.find(p => p.id === socket.id)
    if (!player) return

    // ✅ Agent1 canActivate() 사용
    if (!canActivate(player)) {
      return socket.emit('error:game', { code: 'INSUFFICIENT_AG', message: 'AG가 100 미만입니다.' })
    }

    // 발동할 어빌리티 찾기 (attacker 슬롯 기준)
    const allAbilities = [
      ...player.party.attacker.abilities,
      ...player.party.defender.abilities,
      ...player.party.intelligence.abilities,
    ]
    const ability = allAbilities.find(a => a.id === abilityId)
    if (!ability) {
      return socket.emit('error:game', { code: 'ABILITY_NOT_FOUND', message: '어빌리티를 찾을 수 없습니다.' })
    }

    // ✅ Agent1 activateAbility() 사용 — AG=0 초기화 + activeAbility 설정
    const pIdx = room.gameState.players.findIndex(p => p.id === socket.id)
    room.gameState.players[pIdx] = activateAbility(player, ability)

    io.to(roomId).emit('game:abilityUsed', {
      playerId: socket.id,
      ability,
      effect:   { effectType: ability.effectType, value: ability.value, duration: ability.duration },
    })

    broadcastState(io, roomId)
  })

  // ────────────────────────────────────────────────────────
  // game:battleItem — 전투 중 아이템 사용
  // ────────────────────────────────────────────────────────
  socket.on('game:battleItem', (payload: GameBattleItemPayload) => {
    const { roomId, itemId } = payload
    const room = getRoomById(roomId)
    if (!room?.gameState) {
      return socket.emit('error:game', { code: 'GAME_NOT_FOUND', message: '게임 상태를 찾을 수 없습니다.' })
    }

    if (room.gameState.phase !== 'battle') {
      return socket.emit('error:game', { code: 'WRONG_PHASE', message: '전투 중이 아닙니다.' })
    }

    const player = room.gameState.players.find(p => p.id === socket.id)
    if (!player) return

    const item = player.items.find(it => it.id === itemId)
    if (!item) {
      return socket.emit('error:game', { code: 'ITEM_NOT_FOUND', message: '아이템을 찾을 수 없습니다.' })
    }

    // ✅ Agent1 canUseItem() — during_battle 타이밍 검증
    if (!canUseItem(item, 'during_battle')) {
      return socket.emit('error:game', { code: 'WRONG_TIMING', message: '전투 중에 사용할 수 없는 아이템입니다.' })
    }

    // ✅ Agent1 removeItem() — 인벤토리 제거
    const pIdx = room.gameState.players.findIndex(p => p.id === socket.id)
    room.gameState.players[pIdx] = removeItem(player, itemId)

    // 전투 중 아이템은 다음 battleResult 계산 시 적용
    // 소켓 data에 임시 저장해서 endTurn/battleResult 때 활용
    socket.data.pendingBattleItem = item

    io.to(roomId).emit('game:itemUsed', {
      playerId: socket.id,
      item,
      effect:   { effectType: item.effectType, value: item.value },
    })
    broadcastState(io, roomId)
  })

  // ────────────────────────────────────────────────────────
  // game:endTurn — 턴 종료
  // ────────────────────────────────────────────────────────
  socket.on('game:endTurn', ({ roomId }: { roomId: string }) => {
    const room = getRoomById(roomId)
    if (!room?.gameState) {
      return socket.emit('error:game', { code: 'GAME_NOT_FOUND', message: '게임 상태를 찾을 수 없습니다.' })
    }

    if (room.gameState.currentTurn !== socket.id) {
      return socket.emit('error:game', { code: 'NOT_YOUR_TURN', message: '현재 당신의 턴이 아닙니다.' })
    }

    // ✅ 턴 종료 시 현재 플레이어의 어빌리티 duration tick
    const pIdx = room.gameState.players.findIndex(p => p.id === socket.id)
    if (pIdx !== -1) {
      room.gameState.players[pIdx] = tickAbilityDuration(room.gameState.players[pIdx])
    }

    const updated = nextTurn(roomId)
    if (!updated) return

    io.to(roomId).emit('game:turnChanged', {
      currentTurn: updated.currentTurn,
      turnNumber:  updated.turnNumber,
    })

    broadcastState(io, roomId)
  })

  // ────────────────────────────────────────────────────────
  // disconnect — 소켓 연결 끊김
  // ────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    dequeueMatchmaking(socket.id)

    const room = getRoomBySocketId(socket.id)
    if (room && room.status === 'playing') {
      handleDisconnect(io, socket.id, room.id)
    } else if (room) {
      // 게임 시작 전 나간 경우
      cleanupFromRoom(io, socket, room.id)
    }
  })
}

// ──────────────────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────────────────
function cleanupFromRoom(io: Server, socket: Socket, roomId: string): void {
  const before = getRoomById(roomId)
  const remaining = leaveRoom(roomId, socket.id)
  socket.leave(roomId)
  dequeueMatchmaking(socket.id)

  if (!before) return

  if (!remaining) {
    // 방이 삭제됨 (마지막 플레이어 퇴장)
    if (!before.isPrivate) {
      io.to('lobby').emit('lobby:roomRemoved', { roomId })
    }
  } else {
    // 방에 플레이어 남아 있음 → 인원 변경 알림
    if (!remaining.isPrivate) {
      io.to('lobby').emit('lobby:roomUpdated', { room: toLobbyRoom(remaining) })
    }
  }
}

function getOpponentUserId(state: NonNullable<Room['gameState']>, mySocketId: string): string {
  const opponent = state.players.find((p: { id: string; userId: string }) => p.id !== mySocketId)
  return opponent?.userId ?? ''
}
