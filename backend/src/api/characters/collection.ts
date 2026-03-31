/**
 * collection.ts — 캐릭터 컬렉션 조회
 *
 * 엔드포인트:
 *   GET /api/characters        — 전체 캐릭터 카탈로그 (마스터 데이터)
 *   GET /api/characters/my     — 보유 캐릭터 목록 (user_characters JOIN)
 *   GET /api/characters/:id    — 단일 캐릭터 상세
 */

import { Router, Request, Response } from 'express'
import { supabase } from '../../lib/supabaseClient'
import { CHARACTER_CATALOG, getCharacterById } from './data'

const router = Router()

// ── GET /api/characters — 전체 카탈로그 ──────────────────────────
router.get('/', (_req: Request, res: Response) => {
  res.json({ characters: CHARACTER_CATALOG })
})

// ── GET /api/characters/my — 보유 캐릭터 ────────────────────────
router.get('/my', async (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string | undefined

  if (!userId) {
    res.status(401).json({ error: '인증이 필요합니다. X-User-Id 헤더를 전달해주세요.' })
    return
  }

  const { data, error } = await supabase
    .from('user_characters')
    .select('character_id, obtained_at')
    .eq('user_id', userId)

  if (error) {
    res.status(500).json({ error: `보유 캐릭터 조회 실패: ${error.message}` })
    return
  }

  const owned = (data ?? []).map(row => {
    const char = getCharacterById(row.character_id)
    return {
      ...char,
      acquiredAt: row.obtained_at,
    }
  }).filter(c => c.id !== undefined)

  res.json({ characters: owned, total: owned.length })
})

// ── GET /api/characters/:id — 단일 캐릭터 ───────────────────────
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const char = getCharacterById(id)

  if (!char) {
    res.status(404).json({ error: `캐릭터를 찾을 수 없습니다: ${id}` })
    return
  }

  res.json({ character: char })
})

export default router
