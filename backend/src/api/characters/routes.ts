/**
 * routes.ts — 캐릭터 API 통합 라우터
 *
 * 마운트 위치: /api/characters
 *
 * 엔드포인트 전체 목록:
 *
 *   [컬렉션]
 *   GET  /api/characters          — 전체 캐릭터 카탈로그
 *   GET  /api/characters/my       — 보유 캐릭터
 *   GET  /api/characters/:id      — 단일 캐릭터 상세
 *
 *   [가챠]
 *   POST /api/characters/gacha/single  — 1회 뽑기
 *   POST /api/characters/gacha/ten     — 10연챠
 *
 *   [덱]
 *   GET  /api/characters/deck          — 현재 덱 조회
 *   PUT  /api/characters/deck          — 덱 저장/수정
 */

import { Router, Request, Response } from 'express'
import collectionRouter from './collection'
import { singleGacha, tenGacha, GACHA_COST } from './gacha'
import { getDeck, saveDeck } from './deck'

const router = Router()

// ── 컬렉션 서브 라우터 ────────────────────────────────────────────
// GET /api/characters, GET /api/characters/my, GET /api/characters/:id
router.use('/', collectionRouter)

// ── 가챠 ─────────────────────────────────────────────────────────

/**
 * POST /api/characters/gacha/single
 * Body: { userId: string, costType: 'GP' | 'CP' }
 */
router.post('/gacha/single', async (req: Request, res: Response) => {
  const { userId, costType } = req.body as { userId?: string; costType?: 'GP' | 'CP' }

  if (!userId || !costType) {
    res.status(400).json({ error: 'userId와 costType이 필요합니다.' })
    return
  }
  if (costType !== 'GP' && costType !== 'CP') {
    res.status(400).json({ error: "costType은 'GP' 또는 'CP' 중 하나여야 합니다." })
    return
  }

  try {
    const character = await singleGacha(userId, costType)
    const cost = costType === 'GP' ? GACHA_COST.single_gp : GACHA_COST.single_cp
    res.json({ character, cost, costType })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ error: message })
  }
})

/**
 * POST /api/characters/gacha/ten
 * Body: { userId: string, costType: 'GP' | 'CP' }
 */
router.post('/gacha/ten', async (req: Request, res: Response) => {
  const { userId, costType } = req.body as { userId?: string; costType?: 'GP' | 'CP' }

  if (!userId || !costType) {
    res.status(400).json({ error: 'userId와 costType이 필요합니다.' })
    return
  }
  if (costType !== 'GP' && costType !== 'CP') {
    res.status(400).json({ error: "costType은 'GP' 또는 'CP' 중 하나여야 합니다." })
    return
  }

  try {
    const characters = await tenGacha(userId, costType)
    const cost = costType === 'GP' ? GACHA_COST.ten_gp : GACHA_COST.ten_cp
    res.json({ characters, cost, costType })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ error: message })
  }
})

// ── 덱 ───────────────────────────────────────────────────────────

/**
 * GET /api/characters/deck
 * Header: X-User-Id: string
 */
router.get('/deck', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined

  if (!userId) {
    res.status(401).json({ error: '인증이 필요합니다. X-User-Id 헤더를 전달해주세요.' })
    return
  }

  try {
    const deck = await getDeck(userId)
    if (!deck) {
      res.status(404).json({ error: '편성된 덱이 없습니다.' })
      return
    }
    res.json({ deck })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: message })
  }
})

/**
 * PUT /api/characters/deck
 * Header: X-User-Id: string
 * Body: { attackerId: string, defenderId: string, intelligenceId: string }
 */
router.put('/deck', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined

  if (!userId) {
    res.status(401).json({ error: '인증이 필요합니다. X-User-Id 헤더를 전달해주세요.' })
    return
  }

  const { attackerId, defenderId, intelligenceId } = req.body as {
    attackerId?:     string
    defenderId?:     string
    intelligenceId?: string
  }

  if (!attackerId || !defenderId || !intelligenceId) {
    res.status(400).json({ error: 'attackerId, defenderId, intelligenceId 모두 필요합니다.' })
    return
  }

  try {
    const deck = await saveDeck(userId, { attackerId, defenderId, intelligenceId })
    res.json({ deck })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    res.status(400).json({ error: message })
  }
})

export default router
