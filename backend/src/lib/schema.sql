-- ============================================================
-- FateDice — 전체 DB 스키마
-- Supabase Dashboard → SQL Editor에서 실행
-- ============================================================

-- uuid_generate_v4() 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- 1. users — 계정 + 게임 재화
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT UNIQUE NOT NULL,
  nickname    TEXT UNIQUE NOT NULL,
  gp          INTEGER DEFAULT 1000,   -- 시작 골드 포인트
  cp          INTEGER DEFAULT 0,      -- 캐시 포인트
  shard       INTEGER DEFAULT 0,      -- 조각 (중복 보상)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 2. characters — 캐릭터 마스터 데이터 (읽기 전용)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS characters (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  class       TEXT NOT NULL
    CHECK (class IN ('King','Queen','Rook','Bishop','Knight','Pawn')),
  grade       TEXT NOT NULL
    CHECK (grade IN ('Normal','Rare','Epic','Legendary')),
  attribute   TEXT NOT NULL
    CHECK (attribute IN ('Sword','Wand','Disk','Cup')),
  stats       JSONB NOT NULL,   -- { mov, atk, def, int, hp }
  abilities   JSONB NOT NULL,   -- Ability[]
  image_url   TEXT
);

-- ──────────────────────────────────────────────────────────
-- 3. user_characters — 보유 캐릭터 인벤토리
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_characters (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id),
  obtained_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, character_id)   -- 중복 소유 방지
);

-- ──────────────────────────────────────────────────────────
-- 4. decks — 덱 편성 (1인 1덱)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) UNIQUE,
  attacker_id      UUID NOT NULL REFERENCES characters(id),
  defender_id      UUID NOT NULL REFERENCES characters(id),
  intelligence_id  UUID NOT NULL REFERENCES characters(id),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 5. matches — 게임 전적
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id    TEXT NOT NULL,
  mode       TEXT NOT NULL CHECK (mode IN ('1v1','2v2')),
  winner_id  UUID REFERENCES users(id),
  players    JSONB NOT NULL,   -- 참가자 배열 [{userId, nickname, ...}]
  duration   INTEGER,          -- 게임 시간(초)
  played_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 6. rankings — ELO 레이팅
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rankings (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  wins       INTEGER DEFAULT 0,
  losses     INTEGER DEFAULT 0,
  rating     INTEGER DEFAULT 1000,   -- ELO 시작값
  season     INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 7. gacha_logs — 뽑기 이력 + 천장 시스템
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gacha_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id),
  grade        TEXT NOT NULL,
  cost_type    TEXT NOT NULL CHECK (cost_type IN ('GP','CP')),
  pity_count   INTEGER DEFAULT 0,   -- 현재까지 천장 카운터
  pulled_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- users: 본인만 조회/수정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_select" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (auth.uid() = id);

-- characters: 전체 공개 (읽기만)
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters_read_all" ON characters
  FOR SELECT USING (true);

-- user_characters: 본인만
ALTER TABLE user_characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_chars_own" ON user_characters
  USING (auth.uid() = user_id);

-- decks: 본인만
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "decks_own" ON decks
  USING (auth.uid() = user_id);

-- matches: 전체 공개 읽기, 서버만 쓰기
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_read_all" ON matches
  FOR SELECT USING (true);

-- rankings: 전체 공개 읽기, 서버만 쓰기
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rankings_read_all" ON rankings
  FOR SELECT USING (true);

-- gacha_logs: 본인만
ALTER TABLE gacha_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gacha_logs_own" ON gacha_logs
  USING (auth.uid() = user_id);
