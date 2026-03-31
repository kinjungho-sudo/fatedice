'use client'

/**
 * useSocket.ts — 소켓 액션 래퍼 훅
 *
 * 실제 소켓 처리는 gameStore.ts 내부에서 담당합니다.
 * 이 훅은 gameStore 액션을 편의상 재노출합니다.
 */

import { useGameStore } from '../store/gameStore'

export function useSocket() {
  const {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startMatchmaking,
    setReady,
    rollDice,
    useItem,
    useAbility,
    useBattleItem,
    endTurn,
  } = useGameStore()

  return {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startMatchmaking,
    setReady,
    rollDice,
    useItem,
    useAbility,
    useBattleItem,
    endTurn,
  }
}
