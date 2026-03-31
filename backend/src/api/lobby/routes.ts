/**
 * lobby/routes.ts — 대기실 REST API
 *
 * GET  /api/lobby/rooms            — 공개 방 목록 조회
 * GET  /api/lobby/rooms/:roomId    — 특정 방 정보 조회
 * GET  /api/lobby/queue/:mode      — 매칭 큐 대기자 수
 *
 * ※ 방 생성/입장은 소켓 이벤트(room:create, room:join)로 처리
 * ※ 이 REST API는 로비 화면 초기 로드 전용
 */

import { Router, Request, Response } from 'express'
import {
  getPublicRooms,
  getRoomById,
  getQueueLength,
} from '../../socket/roomManager'

const router = Router()

// ──────────────────────────────────────────────────────────
// GET /api/lobby/rooms?mode=1v1|2v2
// 대기 중인 공개 방 목록 반환
// ──────────────────────────────────────────────────────────
router.get('/rooms', (_req: Request, res: Response) => {
  const mode = _req.query.mode as '1v1' | '2v2' | undefined

  if (mode && mode !== '1v1' && mode !== '2v2') {
    return res.status(400).json({ error: 'mode는 1v1 또는 2v2여야 합니다.' })
  }

  const rooms = getPublicRooms(mode)
  return res.json({ rooms, total: rooms.length })
})

// ──────────────────────────────────────────────────────────
// GET /api/lobby/rooms/:roomId
// 특정 방 정보 (입장 전 미리보기용)
// ──────────────────────────────────────────────────────────
router.get('/rooms/:roomId', (req: Request, res: Response) => {
  const room = getRoomById(req.params.roomId)

  if (!room) {
    return res.status(404).json({ error: '방을 찾을 수 없습니다.' })
  }

  // password는 절대 클라이언트에 노출하지 않음
  return res.json({
    room: {
      id:           room.id,
      title:        room.title,
      mode:         room.mode,
      playerCount:  room.players.length,
      maxPlayers:   room.maxPlayers,
      isPrivate:    room.isPrivate,
      status:       room.status,
      hostNickname: room.players[0]?.nickname ?? 'Unknown',
      players:      room.players.map(p => ({
        userId:   p.userId,
        nickname: p.nickname,
        isReady:  p.isReady,
      })),
      createdAt:    room.createdAt,
    },
  })
})

// ──────────────────────────────────────────────────────────
// GET /api/lobby/queue/:mode
// 매칭 큐 현재 대기자 수 (1v1, 2v2)
// ──────────────────────────────────────────────────────────
router.get('/queue/:mode', (req: Request, res: Response) => {
  const mode = req.params.mode as '1v1' | '2v2'

  if (mode !== '1v1' && mode !== '2v2') {
    return res.status(400).json({ error: 'mode는 1v1 또는 2v2여야 합니다.' })
  }

  const queueLength = getQueueLength(mode)
  const required    = mode === '1v1' ? 2 : 4

  return res.json({
    mode,
    queueLength,
    required,
    estimatedWait: queueLength >= 1 ? 'soon' : 'waiting',
  })
})

export default router
