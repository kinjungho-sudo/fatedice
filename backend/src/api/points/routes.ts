/**
 * points/routes.ts — GP 포인트 API
 *
 * GET  /api/points          — GP 잔액 + 최근 거래 이력 20건
 * POST /api/points/daily    — 일일 출석 보너스 수령 (+200 GP)
 * POST /api/points/spend    — GP 소비 (가챠, 아이템 구매 등)
 * POST /api/points/reward   — 매치 보상 지급 (서버 내부 전용)
 */

import { Router, Request, Response } from 'express'
import { supabase }                  from '../../lib/supabaseClient'
import { authMiddleware, AuthRequest, internalSecretMiddleware } from '../../lib/authMiddleware'

const router = Router()

// ──────────────────────────────────────────────────────────
// GET /api/points — GP 잔액 + 최근 이력
// ──────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId

  const [balanceRes, historyRes, dailyRes] = await Promise.all([
    supabase
      .from('users')
      .select('gp')
      .eq('id', userId)
      .single(),

    supabase
      .from('point_transactions')
      .select('id, amount, balance_after, source, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),

    // 오늘 일일 보너스 수령 여부
    supabase
      .from('daily_rewards')
      .select('claimed_at')
      .eq('user_id', userId)
      .eq('reward_date', new Date().toISOString().slice(0, 10))
      .maybeSingle(),
  ])

  if (balanceRes.error) {
    return res.status(404).json({ error: '유저를 찾을 수 없습니다.' })
  }

  return res.json({
    gp:              balanceRes.data.gp,
    dailyClaimed:    !!dailyRes.data,
    dailyClaimedAt:  dailyRes.data?.claimed_at ?? null,
    history:         historyRes.data ?? [],
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/points/daily — 일일 출석 보너스 수령
// ──────────────────────────────────────────────────────────
router.post('/daily', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId

  const { data, error } = await supabase.rpc('claim_daily_reward', {
    p_user_id: userId,
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result?.success) {
    return res.status(400).json({ error: result?.message ?? '수령에 실패했습니다.' })
  }

  return res.json({
    gp:      result.new_gp,
    earned:  200,
    message: result.message,
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/points/spend — GP 소비
// body: { amount: number, source: string, description?: string }
// ──────────────────────────────────────────────────────────
router.post('/spend', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId
  const { amount, source, description } = req.body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount는 양수 정수여야 합니다.' })
  }
  if (!source) {
    return res.status(400).json({ error: 'source는 필수입니다.' })
  }

  const { data, error } = await supabase.rpc('spend_points', {
    p_user_id:    userId,
    p_amount:     amount,
    p_source:     source,
    p_description: description ?? '',
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const result = Array.isArray(data) ? data[0] : data
  if (!result?.success) {
    return res.status(400).json({ error: result?.message ?? '소비에 실패했습니다.' })
  }

  return res.json({
    gp:      result.new_gp,
    spent:   amount,
    message: result.message,
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/points/reward — 매치 보상 지급 (서버 내부 전용)
// header: x-internal-secret
// body: { userId: string, amount: number, matchId: string }
// ──────────────────────────────────────────────────────────
router.post('/reward', internalSecretMiddleware, async (req: Request, res: Response) => {
  const { userId, amount, matchId } = req.body

  if (!userId || !amount || !matchId) {
    return res.status(400).json({ error: 'userId, amount, matchId는 필수입니다.' })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount는 양수 정수여야 합니다.' })
  }

  const { data, error } = await supabase.rpc('add_match_reward', {
    p_user_id:  userId,
    p_amount:   amount,
    p_match_id: matchId,
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ gp: data, earned: amount })
})

export default router
