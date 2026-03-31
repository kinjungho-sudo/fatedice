/**
 * auth/routes.ts — 인증 API
 *
 * POST /api/auth/signup  — 회원가입
 * POST /api/auth/login   — 로그인 (JWT 반환)
 * POST /api/auth/logout  — 로그아웃
 * GET  /api/auth/me      — 내 정보 조회
 */

import { Router, Request, Response } from 'express'
import { supabase } from '../../lib/supabaseClient'

const router = Router()

// ──────────────────────────────────────────────────────────
// POST /api/auth/signup
// body: { email, password, nickname }
// ──────────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body

  if (!email || !password || !nickname) {
    return res.status(400).json({ error: 'email, password, nickname은 필수입니다.' })
  }

  if (nickname.length < 2 || nickname.length > 16) {
    return res.status(400).json({ error: '닉네임은 2~16자여야 합니다.' })
  }

  // 1. 닉네임 중복 확인
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle()

  if (existing) {
    return res.status(409).json({ error: '이미 사용 중인 닉네임입니다.' })
  }

  // 2. Supabase Auth 회원가입
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return res.status(400).json({ error: authError?.message ?? '회원가입에 실패했습니다.' })
  }

  const userId = authData.user.id

  // 3. users 테이블 레코드 생성 (GP 1000 초기 지급)
  const { error: userError } = await supabase
    .from('users')
    .insert({ id: userId, email, nickname, gp: 1000, cp: 0, shard: 0 })

  if (userError) {
    // 롤백: Auth 유저 삭제
    await supabase.auth.admin.deleteUser(userId)
    return res.status(500).json({ error: '유저 데이터 생성에 실패했습니다.' })
  }

  // 4. rankings 테이블 초기화 (ELO 1000)
  await supabase
    .from('rankings')
    .insert({ user_id: userId, wins: 0, losses: 0, rating: 1000, season: 1 })

  return res.status(201).json({ message: '회원가입 완료', userId })
})

// ──────────────────────────────────────────────────────────
// POST /api/auth/login
// body: { email, password }
// ──────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'email, password는 필수입니다.' })
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
  }

  const { access_token, refresh_token, expires_in } = data.session

  // 유저 정보 추가 반환
  const { data: userData } = await supabase
    .from('users')
    .select('id, nickname, gp, cp, shard')
    .eq('id', data.user.id)
    .single()

  return res.json({
    accessToken: access_token,
    refreshToken: refresh_token,
    expiresIn: expires_in,
    user: userData,
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/auth/logout
// header: Authorization: Bearer <access_token>
// ──────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' })
  }

  // Supabase의 signOut은 클라이언트 측에서 처리하지만 서버에서 세션 무효화
  const { error } = await supabase.auth.admin.signOut(token)

  if (error) {
    return res.status(400).json({ error: error.message })
  }

  return res.json({ message: '로그아웃 완료' })
})

// ──────────────────────────────────────────────────────────
// GET /api/auth/me
// header: Authorization: Bearer <access_token>
// ──────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' })
  }

  // 토큰으로 유저 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, nickname, gp, cp, shard, created_at')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: '유저를 찾을 수 없습니다.' })
  }

  return res.json({ user: data })
})

// ──────────────────────────────────────────────────────────
// 헬퍼
// ──────────────────────────────────────────────────────────
function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export default router
