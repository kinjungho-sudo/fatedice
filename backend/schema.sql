-- ============================================================
-- FateDice — Supabase 데이터베이스 스키마
-- 실행 방법: Supabase Dashboard > SQL Editor에 붙여넣고 Run
-- ============================================================

-- uuid 확장 (Supabase는 기본 활성화)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. users — 유저 계정 및 재화
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  nickname    TEXT UNIQUE NOT NULL,
  gp          INTEGER NOT NULL DEFAULT 1000,   -- 게임 포인트 (시작 지급)
  cp          INTEGER NOT NULL DEFAULT 0,      -- 캐시 포인트
  shard       INTEGER NOT NULL DEFAULT 0,      -- 조각 (중복 캐릭터 변환)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. characters — 캐릭터 마스터 데이터 (읽기 전용)
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
  id          TEXT PRIMARY KEY,   -- 예: 'n_leon', 'r_seraphina', 'l_genesis_king'
  name        TEXT NOT NULL,
  class       TEXT NOT NULL CHECK (class IN ('King','Queen','Rook','Bishop','Knight','Pawn')),
  grade       TEXT NOT NULL CHECK (grade IN ('Normal','Rare','Epic','Legendary')),
  attribute   TEXT NOT NULL CHECK (attribute IN ('Sword','Wand','Disk','Cup')),
  stats       JSONB NOT NULL,    -- { mov, atk, def, int, hp }
  abilities   JSONB NOT NULL,    -- Ability[]
  image_url   TEXT
);

-- ============================================================
-- 3. user_characters — 유저 보유 캐릭터
-- ============================================================
CREATE TABLE IF NOT EXISTS user_characters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id),
  obtained_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, character_id)   -- 중복 보유 방지
);

-- ============================================================
-- 4. decks — 덱 편성 (1인 1덱)
-- ============================================================
CREATE TABLE IF NOT EXISTS decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  attacker_id      TEXT REFERENCES characters(id),
  defender_id      TEXT REFERENCES characters(id),
  intelligence_id  TEXT REFERENCES characters(id),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. matches — 게임 전적
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    TEXT NOT NULL,
  mode       TEXT NOT NULL CHECK (mode IN ('1v1','2v2')),
  winner_id  UUID REFERENCES users(id),
  players    JSONB NOT NULL,   -- 참가자 배열 [{ userId, nickname, rating }]
  duration   INTEGER,          -- 게임 시간(초)
  played_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. rankings — ELO 레이팅 기반 랭킹
-- ============================================================
CREATE TABLE IF NOT EXISTS rankings (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wins       INTEGER NOT NULL DEFAULT 0,
  losses     INTEGER NOT NULL DEFAULT 0,
  rating     INTEGER NOT NULL DEFAULT 1000,   -- ELO 시작값
  season     INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. gacha_logs — 뽑기 이력 + 천장 카운터
-- ============================================================
CREATE TABLE IF NOT EXISTS gacha_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id),
  grade        TEXT NOT NULL,
  cost_type    TEXT NOT NULL CHECK (cost_type IN ('GP','CP')),
  pity_count   INTEGER NOT NULL DEFAULT 0,   -- 해당 시점 천장 카운터
  pulled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) 설정
-- ★ 모든 테이블에 RLS 필수 (미적용 시 배포 불가)
-- ============================================================

-- users: 본인만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- characters: 전체 공개 읽기 (마스터 데이터)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "characters_read_all" ON characters
  FOR SELECT USING (true);

-- user_characters: 본인만
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_chars_select_own" ON user_characters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_chars_insert_own" ON user_characters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- decks: 본인만
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "decks_select_own" ON decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "decks_insert_own" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "decks_update_own" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

-- matches: 전체 공개 읽기
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matches_read_all" ON matches
  FOR SELECT USING (true);

-- rankings: 전체 공개 읽기
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rankings_read_all" ON rankings
  FOR SELECT USING (true);

-- gacha_logs: 본인만
ALTER TABLE gacha_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gacha_logs_select_own" ON gacha_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "gacha_logs_insert_own" ON gacha_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RPC 함수 — deduct_points (가챠 포인트 차감)
-- gacha.ts의 supabase.rpc('deduct_points', ...) 에서 호출
-- ============================================================

CREATE OR REPLACE FUNCTION deduct_points(
  p_user_id UUID,
  p_column  TEXT,   -- 'gp' 또는 'cp'
  p_amount  INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER   -- service role로 실행 (RLS 우회)
AS $$
BEGIN
  -- 유효한 컬럼만 허용 (SQL Injection 방지)
  IF p_column NOT IN ('gp', 'cp') THEN
    RAISE EXCEPTION 'Invalid column: %', p_column;
  END IF;

  IF p_column = 'gp' THEN
    UPDATE users
      SET gp = gp - p_amount
      WHERE id = p_user_id AND gp >= p_amount;
  ELSE
    UPDATE users
      SET cp = cp - p_amount
      WHERE id = p_user_id AND cp >= p_amount;
  END IF;

  -- 잔액 부족 시 (0행 업데이트) 에러
  IF NOT FOUND THEN
    RAISE EXCEPTION '포인트 부족: % 잔액이 %보다 적습니다.', p_column, p_amount;
  END IF;
END;
$$;

-- ============================================================
-- 인덱스 (조회 성능)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_logs_user_id ON gacha_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_played_at ON matches(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_rating ON rankings(rating DESC, season);
