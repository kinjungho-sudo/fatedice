/**
 * index.ts — FateDice 백엔드 메인 서버
 *
 * Express + Socket.io 통합 서버
 * PORT 4000 (기본값)
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { registerSocketEvents } from './socket/events'
import authRouter       from './api/auth/routes'
import rankingRouter    from './api/ranking/routes'
import lobbyRouter      from './api/lobby/routes'
import pointsRouter     from './api/points/routes'
import cashRouter       from './api/cash/routes'
import charactersRouter from './api/characters/routes'

// ──────────────────────────────────────────────────────────
// Express 앱 초기화
// ──────────────────────────────────────────────────────────
const app = express()

app.use(cors({
  origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// ──────────────────────────────────────────────────────────
// REST API 라우터
// ──────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter)
app.use('/api/ranking',    rankingRouter)
app.use('/api/lobby',      lobbyRouter)
app.use('/api/points',     pointsRouter)
app.use('/api/cash',       cashRouter)
app.use('/api/characters', charactersRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 핸들러
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// ──────────────────────────────────────────────────────────
// Socket.io 서버 초기화
// ──────────────────────────────────────────────────────────
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods:     ['GET', 'POST'],
    credentials: true,
  },
  // 재접속 설정
  connectionStateRecovery: {
    maxDisconnectionDuration: 30_000,  // 30초
    skipMiddlewares:          true,
  },
})

// ──────────────────────────────────────────────────────────
// 소켓 미들웨어: 닉네임/덱 정보를 socket.data에 저장
// ──────────────────────────────────────────────────────────
io.use((socket, next) => {
  const { nickname, deck } = socket.handshake.auth

  if (!nickname) {
    return next(new Error('닉네임이 필요합니다. handshake.auth.nickname을 전달해주세요.'))
  }

  socket.data.nickname = nickname
  socket.data.deck     = deck ?? null
  next()
})

// ──────────────────────────────────────────────────────────
// 소켓 연결 처리
// ──────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] 연결: ${socket.id} | 닉네임: ${socket.data.nickname}`)

  registerSocketEvents(io, socket)

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] 연결 끊김: ${socket.id} | 이유: ${reason}`)
  })
})

// ──────────────────────────────────────────────────────────
// 서버 시작
// ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '4000', 10)

httpServer.listen(PORT, () => {
  console.log(`[FateDice] 서버 실행 중 — http://localhost:${PORT}`)
  console.log(`[FateDice] 환경: ${process.env.NODE_ENV ?? 'development'}`)
  console.log(`[FateDice] 프론트엔드 CORS 허용: ${process.env.FRONTEND_URL ?? 'http://localhost:3000'}`)
})

export { io }
