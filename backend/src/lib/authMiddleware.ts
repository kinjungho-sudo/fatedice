/**
 * authMiddleware.ts — JWT 인증 미들웨어
 *
 * Authorization: Bearer <access_token> 헤더 검증
 * 검증 성공 시 req.userId에 사용자 UUID 주입
 *
 * 사용법:
 *   router.get('/protected', authMiddleware, handler)
 *   또는 router.use(authMiddleware) 전체 적용
 */

import { Request, Response, NextFunction } from 'express'
import { supabase } from './supabaseClient'

// req에 userId를 추가한 확장 타입
export interface AuthRequest extends Request {
  userId: string
}

// 사용자 JWT 검증
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증 토큰이 필요합니다.' })
    return
  }

  const token = auth.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    return
  }

  (req as AuthRequest).userId = user.id
  next()
}

// 서버 내부 API 호출 검증 (결제 서버, 게임 서버 간 통신)
// x-internal-secret 헤더로 INTERNAL_API_SECRET 환경변수 검증
export function internalSecretMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = req.headers['x-internal-secret']

  if (!process.env.INTERNAL_API_SECRET) {
    res.status(500).json({ error: 'INTERNAL_API_SECRET 환경변수가 설정되지 않았습니다.' })
    return
  }

  if (secret !== process.env.INTERNAL_API_SECRET) {
    res.status(403).json({ error: '내부 API 접근 권한이 없습니다.' })
    return
  }

  next()
}
