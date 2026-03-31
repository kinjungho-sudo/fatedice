/**
 * ranking/routes.ts — 랭킹 API
 *
 * GET  /api/ranking       — 전체 랭킹 상위 100명
 * GET  /api/ranking/me    — 내 현재 순위
 * POST /api/ranking/update — 게임 결과 반영 (내부 전용 — 소켓 서버에서 호출)
 */

import { Router, Request, Response } from 'express'
import { supabase } from '../../lib/supabaseClient'

const router = Router()

// ──────────────────────────────────────────────────────────
// GET /api/ranking
// 시즌 내 레이팅 내림차순 상위 100명
// ──────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('rankings')
    .select(`
      user_id,
      wins,
      losses,
      rating,
      season,
      updated_at,
      users!inner ( nickname )
    `)
    .order('rating', { ascending: false })
    .limit(100)

  if (error) {
    return res.status(500).json({ error: '랭킹 조회에 실패했습니다.' })
  }

  // 순위 번호 추가
  const ranked = (data ?? []).map((row, index) => ({
    rank:      index + 1,
    userId:    row.user_id,
    nickname:  (row.users as unknown as { nickname: string }).nickname,
    wins:      row.wins,
    losses:    row.losses,
    rating:    row.rating,
    winRate:   row.wins + row.losses > 0
      ? Math.round((row.wins / (row.wins + row.losses)) * 100)
      : 0,
    updatedAt: row.updated_at,
  }))

  return res.json({ rankings: ranked })
})

// ──────────────────────────────────────────────────────────
// GET /api/ranking/me
// header: Authorization: Bearer <access_token>
// ──────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  const token = extractBearerToken(req)
  if (!token) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }

  const { data, error } = await supabase
    .from('rankings')
    .select('user_id, wins, losses, rating, season')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: '랭킹 정보를 찾을 수 없습니다.' })
  }

  // 전체 순위 계산 (내 rating보다 높은 사람 수 + 1)
  const { count } = await supabase
    .from('rankings')
    .select('*', { count: 'exact', head: true })
    .gt('rating', data.rating)

  return res.json({
    userId:   data.user_id,
    wins:     data.wins,
    losses:   data.losses,
    rating:   data.rating,
    season:   data.season,
    rank:     (count ?? 0) + 1,
    winRate:  data.wins + data.losses > 0
      ? Math.round((data.wins / (data.wins + data.losses)) * 100)
      : 0,
  })
})

// ──────────────────────────────────────────────────────────
// POST /api/ranking/update
// body: { winnerId, loserId }
// 내부 전용 — 소켓 서버에서만 호출 (인증 없음, 방화벽으로 보호 필요)
// ──────────────────────────────────────────────────────────
router.post('/update', async (req: Request, res: Response) => {
  const { winnerId, loserId } = req.body

  if (!winnerId || !loserId) {
    return res.status(400).json({ error: 'winnerId, loserId는 필수입니다.' })
  }

  // 두 유저의 현재 레이팅 조회
  const { data: rankings, error: fetchError } = await supabase
    .from('rankings')
    .select('user_id, rating, wins, losses')
    .in('user_id', [winnerId, loserId])

  if (fetchError || !rankings || rankings.length < 2) {
    return res.status(404).json({ error: '유저 랭킹 정보를 찾을 수 없습니다.' })
  }

  const winnerRanking = rankings.find(r => r.user_id === winnerId)!
  const loserRanking  = rankings.find(r => r.user_id === loserId)!

  // ELO 계산
  const { newWinnerRating, newLoserRating } = calculateElo(
    winnerRanking.rating,
    loserRanking.rating
  )

  // 병렬 업데이트
  const [winnerUpdate, loserUpdate] = await Promise.all([
    supabase
      .from('rankings')
      .update({
        wins:       winnerRanking.wins + 1,
        rating:     newWinnerRating,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', winnerId),

    supabase
      .from('rankings')
      .update({
        losses:     loserRanking.losses + 1,
        rating:     newLoserRating,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', loserId),
  ])

  if (winnerUpdate.error || loserUpdate.error) {
    return res.status(500).json({ error: '랭킹 업데이트에 실패했습니다.' })
  }

  return res.json({
    winner: { userId: winnerId, oldRating: winnerRanking.rating, newRating: newWinnerRating },
    loser:  { userId: loserId,  oldRating: loserRanking.rating,  newRating: newLoserRating  },
  })
})

// ──────────────────────────────────────────────────────────
// ELO 계산 유틸
// 표준 공식: newRating = rating + K * (actual - expected)
// K = 32 (FateDice 기본값)
// expected = 1 / (1 + 10^((opponent_rating - my_rating) / 400))
// ──────────────────────────────────────────────────────────
function calculateElo(
  winnerRating: number,
  loserRating: number,
  K = 32
): { newWinnerRating: number; newLoserRating: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating  - winnerRating) / 400))
  const expectedLoser  = 1 / (1 + Math.pow(10, (winnerRating - loserRating)  / 400))

  const newWinnerRating = Math.round(winnerRating + K * (1 - expectedWinner))
  const newLoserRating  = Math.max(100, Math.round(loserRating  + K * (0 - expectedLoser)))

  return { newWinnerRating, newLoserRating }
}

function extractBearerToken(req: Request): string | null {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export { calculateElo }
export default router
