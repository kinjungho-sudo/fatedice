/**
 * supabaseClient.ts — Supabase 공용 클라이언트 (백엔드 전용)
 *
 * ★ SUPABASE_SERVICE_KEY 사용 — RLS 우회 권한 있음
 * ★ 이 클라이언트를 절대 프론트엔드 번들에 포함시키지 말 것
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    '[supabaseClient] SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.\n' +
    '.env.example을 참고해서 backend/.env 파일을 만들어주세요.'
  )
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
