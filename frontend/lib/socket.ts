/**
 * socket.ts — Socket.io 클라이언트 싱글톤
 *
 * 게임 전체에서 단일 소켓 인스턴스를 공유합니다.
 * 서버 이벤트 명세: /backend/socket/EVENTS.md
 */

import { io, Socket } from 'socket.io-client'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000'

let socket: Socket | null = null

/**
 * 소켓 초기화 및 연결
 * @param nickname - 소켓 핸드셰이크에 전달할 닉네임
 * @param deck     - 덱 정보 (게임 입장 시 필요)
 */
export function initSocket(nickname: string, deck?: object): Socket {
  if (socket?.connected) return socket

  socket = io(BACKEND_URL, {
    auth:             { nickname, deck: deck ?? null },
    autoConnect:      true,
    reconnection:     true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('[Socket] 연결됨:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] 연결 끊김:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[Socket] 연결 오류:', err.message)
  })

  return socket
}

/** 소켓 인스턴스 반환 (없으면 null) */
export function getSocket(): Socket | null {
  return socket
}

/** 소켓 연결 해제 */
export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}
