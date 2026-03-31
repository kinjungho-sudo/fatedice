/**
 * cash/routes.ts — CP 캐시 API
 *
 * GET  /api/cash              — CP 잔액 + 최근 거래 이력 20건
 * POST /api/cash/spend        — CP 소비 (프리미엄 가챠, 상점 구매 등)
 * POST /api/cash/purchase     — CP 충전 (결제 완료 후 결제 서버에서 호출, 내부 전용)
 *
 * ※ 실제 결제 처리(PG 연동)는 외부 결제 서버가 담당
 *    결제 성공 후 결제 서버 → POST /api/cash/purchase (x-internal-secret 인증)
 */

import { Router, Request, Response } from 'express'
import { supabase }                  from '../../lib/supabaseClient'
import { authMiddleware, AuthRequest, internalSecretMiddleware } from '../../lib/authMiddleware'

const router = Router()

// CP 상품 정책 (프론트 표시용 + 검증용)
const CP_PACKAGES = [
  { id: 'cp_100',   cp: 100,   price: 1100  },
  { id: 'cp_300',   cp: 300,   price: 3300  },
  { id: 'cp_500',   cp: 500,   price: 5500  },
  { id: 'cp_1000',  cp: 1000,  price: 11000 },
  { id: 'cp_3000',  cp: 3000,  price: 33000 },
  { id: 'cp_5000',  cp: 5000,  price: 55000 },
]

// ──────────────────────────────────────────────────────────
// GET /api/cash — CP 잔액 + 최근 이력 + 상품 목록
// ──────────────────────────────────────────────────────────
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).userId

  const [balanceRes, historyRes] = await Promise.all([
    supabase
      .from('users')
      .select('cp')
      .eq('id', userId)
      .single(),

    supabase
      .from('cash_transactions')
      .select('id, amount, balance_after, source, description, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (balanceRes.error) {
    return res.status(404).json({ error: '유저를 찾을 수 없습니다.' })
  }

  return res.json({
    cp:       balanceRes.data.cp,
    packages: CP_PACKAGES,
    history:  historyRes.data ?? [],
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/cash/spend — CP 소비
// body: { amount: number, source: string, description?: string }
// source: 'gacha_premium' | 'shop_item' | 'premium_feature'
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

  const { data, error } = await supabase.rpc('spend_cash', {
    p_user_id:     userId,
    p_amount:      amount,
    p_source:      source,
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
    cp:      result.new_cp,
    spent:   amount,
    message: result.message,
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/cash/purchase — CP 충전 (결제 서버 내부 전용)
// header: x-internal-secret
// body: { userId: string, amount: number, packageId?: string, paymentRef?: string }
// ──────────────────────────────────────────────────────────
router.post('/purchase', internalSecretMiddleware, async (req: Request, res: Response) => {
  const { userId, amount, packageId, paymentRef } = req.body

  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId, amount는 필수입니다.' })
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount는 양수 정수여야 합니다.' })
  }

  const description = packageId
    ? `CP 충전 패키지 ${packageId}${paymentRef ? ` (ref: ${paymentRef})` : ''}`
    : `CP 충전 ${amount}CP`

  const { data, error } = await supabase.rpc('add_cash', {
    p_user_id:     userId,
    p_amount:      amount,
    p_source:      'purchase',
    p_description: description,
  })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.json({ cp: data, purchased: amount })
})

// ──────────────────────────────────────────────────────────
// GET /api/cash/packages — CP 상품 목록 (인증 불필요, 공개)
// ──────────────────────────────────────────────────────────
router.get('/packages', (_req: Request, res: Response) => {
  return res.json({ packages: CP_PACKAGES })
})

export default router
